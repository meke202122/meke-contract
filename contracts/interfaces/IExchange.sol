// SPDX-License-Identifier: GPL-2.0-or-later


pragma solidity ^0.8.12;
pragma abicoder v2;

import "../lib/LibOrder.sol";

interface IExchange {
  function matchOrders(
        LibOrder.OrderParam memory takerOrderParam,
        LibOrder.OrderParam[] memory makerOrderParams,
        address _perpetual,
        LibOrder.OrderData[] memory orderDatas,
        uint256 takerGasFee
    ) external ;
}
