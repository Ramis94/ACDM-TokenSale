pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "hardhat/console.sol";
import "./ACDMToken.sol";
import "./OnlyDAO.sol";

contract ACDMPlatform is OnlyDAO {

    using Counters for Counters.Counter;
    Counters.Counter private orderIds;

    ACDMToken private acdmToken;
    IERC20 private eth;
    mapping(address => address) referrals;
    uint256 private roundTime;
    uint256 private acdmMult;
    Status private currentStatus;
    SaleRound private sale;
    TradeRound private trade;

    enum Status {
        INIT,
        SALE,
        TRADE
    }

    struct SaleRound {
        uint256 amount;
        uint256 price;
        uint256 endTime;
        uint256 firstLevelFee;
        uint256 secondLevelFee;
    }

    struct TradeRound {
        uint256 endTime;
        uint256 volume;
        uint256 firstLevelFee;
        uint256 secondLevelFee;
        mapping(uint256 => Orders) orders;
    }

    struct Orders {
        address author;
        uint256 price;
        uint256 amount;
    }

    event SaleRoundStarted(
        uint256 indexed price,
        uint256 indexed amount,
        uint256 indexed endTime
    );

    event ACDMBought(
        address indexed sender,
        uint256 amount
    );

    event TradeRoundStarted(
        uint256 endTime
    );

    event OrderAdded(
        uint256 indexed id,
        address indexed author,
        uint256 amount,
        uint256 price
    );

    event OrderDeleted(
        uint256 id
    );

    event OrderRedeemed(
        address indexed sender,
        uint256 amount
    );

    //eth = 0xc778417E063141139Fce010982780140Aa0cD5Ab
    constructor(address _ACDMToken, uint256 _roundTime, address _eth) {
        acdmToken = ACDMToken(_ACDMToken);
        roundTime = _roundTime;
        eth = IERC20(_eth);
        sale.firstLevelFee = 5;
        sale.secondLevelFee = 3;
        trade.firstLevelFee = 3;
        trade.secondLevelFee = 3;
        currentStatus = Status.INIT;
        acdmMult = 10 ** acdmToken.decimals();
    }

    //нужно проверить что реферал существует в системе, реферальная система 2-ух уровневая
    //реферал может быть 0
    //для работы необязательно быть зареганым
    function register(address referral) public {
        if (referral != address(0)) {
            require(referrals[referral] != address(0), "ACDM: referral not found");
        }
        referrals[msg.sender] = referral;
    }

    //продаем токенов на сумму 1eth(100_000 ACDM) (0,0000100 - цена 1 токена)
    //если токены не продались, то их сжигаем
    function startSaleRound() public {
        if (currentStatus == Status.INIT) {
            sale.price = 10000000000000 wei;
            sale.amount = 100_000;
        } else {
            sale.price = sale.price / 100 * 3 + 400000000000;
            sale.amount = trade.volume / sale.price;
        }
        sale.endTime = block.timestamp + roundTime;
        acdmToken.mint(address(this), sale.amount);
        console.log("%s : %s : %s", sale.price, sale.amount, sale.endTime);
        currentStatus = Status.SALE;
        emit SaleRoundStarted(sale.price, sale.amount, sale.endTime);
    }

    //если время вышло или продали все токены, то вызываем startTradeRound
    function buyACDM(uint256 amount) public payable {
        require(currentStatus == Status.SALE, "ACDMPlatform: is not sale status");
        if (block.timestamp > sale.endTime) {
            startTradeRound();
        } else {
            require(amount < acdmToken.balanceOf(address(this)), "ACDMPlatform: amount is big");
            acdmToken.transfer(msg.sender, amount);
            (address referralFirstLevel, address referralSecondLevel) = findReferrals();
            if (referralFirstLevel != address(0) && referralSecondLevel == address(0)) {
                eth.transferFrom(
                    msg.sender,
                    address(this),
                    (amount * sale.price / 100) * (100 - sale.firstLevelFee)
                );
                eth.transferFrom(
                    msg.sender,
                    referralFirstLevel,
                    (amount * sale.price / 100) * sale.firstLevelFee
                );
            } else if (referralFirstLevel != address(0) && referralSecondLevel != address(0)) {
                eth.transferFrom(
                    msg.sender,
                    address(this),
                    (amount * sale.price / 100) * (100 - sale.firstLevelFee - sale.secondLevelFee)
                );
                eth.transferFrom(
                    msg.sender,
                    referralFirstLevel,
                    (amount * sale.price / 100) * sale.firstLevelFee
                );
                eth.transferFrom(
                    msg.sender,
                    referralSecondLevel,
                    (amount * sale.price / 100) * sale.secondLevelFee);
            } else {
                eth.transferFrom(msg.sender, address(this), amount * sale.price);
            }
            sale.amount -= amount;
            emit ACDMBought(msg.sender, amount);
            if (acdmToken.balanceOf(address(this)) == 0) {
                startTradeRound();
            }
        }
    }

    //сжигаем токены если не все были проданы
    function startTradeRound() public {
        if (acdmToken.balanceOf(address(this)) != 0) {
            acdmToken.burn(address(this), acdmToken.balanceOf(address(this)));
        }
        currentStatus = Status.TRADE;
        trade.volume = 0;
        trade.endTime = block.timestamp + roundTime;
        emit TradeRoundStarted(trade.endTime);
    }

    function addOrder(uint256 amount, uint256 price) public {
        require(amount != 0, "ACDMPlatform: amount is 0");
        require(price != 0, "ACDMPlatform: price is 0");
        acdmToken.transferFrom(msg.sender, address(this), amount);
        orderIds.increment();
        trade.orders[orderIds.current()].author = msg.sender;
        trade.orders[orderIds.current()].amount = amount;
        trade.orders[orderIds.current()].price = price;
        emit OrderAdded(orderIds.current(), msg.sender, amount, price);
    }

    function removeOrder(uint256 id) public {
        require(trade.orders[id].amount != 0, "ACDMPlatform: Order not found");
        require(trade.orders[id].author == msg.sender, "ACDMPlatform: Error delete. You're not owner");
        acdmToken.transfer(msg.sender, trade.orders[id].amount);
        _removeOrder(id);
    }

    function redeemOrder(uint256 id, uint256 amount) public payable {
        if (block.timestamp > trade.endTime) {
            startSaleRound();
        } else {
            require(amount != 0, "ACDMPlatform: amount is 0");
            require(trade.orders[id].amount != 0, "ACDMPlatform: Order not found");
            Orders storage order = trade.orders[id];
            require(order.amount > amount, "ACDMPlatform: amount is big");
            acdmToken.transfer(msg.sender, amount);
            (address referralFirstLevel, address referralSecondLevel) = findReferrals();
            if (referralFirstLevel != address(0) && referralSecondLevel == address(0)) {
                eth.transferFrom(
                    msg.sender,
                    address(this),
                    (amount * order.price / 100) * (100 - trade.firstLevelFee)
                );
                eth.transferFrom(
                    msg.sender,
                    referralFirstLevel,
                    (amount * order.price / 100) * trade.firstLevelFee
                );
            } else if (referralFirstLevel != address(0) && referralSecondLevel != address(0)) {
                eth.transferFrom(
                    msg.sender,
                    address(this),
                    (amount * order.price / 100) * (100 - trade.firstLevelFee - trade.secondLevelFee)
                );
                eth.transferFrom(
                    msg.sender,
                    referralFirstLevel,
                    (amount * order.price / 100) * trade.firstLevelFee
                );
                eth.transferFrom(
                    msg.sender,
                    referralSecondLevel,
                    (amount * order.price / 100) * trade.secondLevelFee);
            } else {
                eth.transferFrom(msg.sender, address(this), amount * order.price);
            }
            emit OrderRedeemed(msg.sender, amount);
            if (order.amount == 0) {
                _removeOrder(id);
            }
        }
    }

    function _removeOrder(uint256 id) private {
        delete trade.orders[id];
        emit OrderDeleted(id);
    }

    function findReferrals() private view returns (address referralFirstLevel, address referralSecondLevel) {
        referralFirstLevel = referrals[msg.sender];
        referralSecondLevel = referrals[referralFirstLevel];
    }

    function setReferralFirstLevelForSale(uint256 fee) public onlyDAO {
        sale.firstLevelFee = fee;
    }

    function setReferralSecondLevelForSale(uint256 fee) public onlyDAO {
        sale.secondLevelFee = fee;
    }

    function setReferralFirstLevelForTrade(uint256 fee) public onlyDAO {
        trade.firstLevelFee = fee;
    }

    function setReferralSecondLevelForTrade(uint256 fee) public onlyDAO {
        trade.secondLevelFee = fee;
    }
}