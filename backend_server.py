"""
竹林司马后端服务器
提供 WebSocket 实时数据 + REST API 历史K线接口
桥接前端协议 <-> 后端 RealtimeEngine
"""
import asyncio
import json
import logging
import random
import time
from datetime import datetime, timedelta

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

# ─── 全局状态 ────────────────────────────────────────────────────────────────
CONNECTED_CLIENTS: dict[str, WebSocket] = {}
STOCK_SUBSCRIPTIONS: dict[str, set[str]] = {}  # stock_code -> set of client_ids
HISTORY_CACHE: dict[str, list] = {}  # stock_code -> cached K-line history
LATEST_PRICES: dict[str, dict] = {}  # stock_code -> latest price data
STOCK_NAMES: dict[str, str] = {
    "600406.SH": "国电南瑞",
    "000001.SZ": "平安银行",
    "300750.SZ": "宁德时代",
    "600519.SH": "贵州茅台",
    "000858.SZ": "五粮液",
    "600036.SH": "招商银行",
    "002594.SZ": "比亚迪",
    "601318.SH": "中国平安",
    "600276.SH": "恒瑞医药",
    "000651.SZ": "格力电器",
    "000333.SZ": "美的集团",
}

# ─── 模拟数据生成器 ───────────────────────────────────────────────────────────
def generate_history(ts_code: str, days: int = 120) -> list:
    """生成模拟历史K线数据"""
    if ts_code in HISTORY_CACHE:
        return HISTORY_CACHE[ts_code]

    base_price = {
        "600406.SH": 28.5, "000001.SZ": 12.3, "300750.SZ": 185.0,
        "600519.SH": 1680.0, "000858.SZ": 145.0, "600036.SH": 35.0,
        "002594.SZ": 245.0, "601318.SH": 48.0, "600276.SH": 52.0,
        "000651.SZ": 42.0, "000333.SZ": 62.0,
    }.get(ts_code, 30.0)

    price = base_price
    candles = []
    now = datetime.now()

    for i in range(days, 0, -1):
        trade_date = now - timedelta(days=i)
        # 跳过周末
        if trade_date.weekday() >= 5:
            continue

        change_pct = random.uniform(-0.03, 0.035)
        open_ = price
        close = round(price * (1 + change_pct), 2)
        high = round(max(open_, close) * random.uniform(1.001, 1.02), 2)
        low = round(min(open_, close) * random.uniform(0.98, 0.999), 2)
        volume = random.randint(5000000, 50000000)
        price = close

        # 时间戳（秒，UTC）
        ts = int(trade_date.timestamp())

        candles.append({
            "time": ts, "open": open_, "high": high, "low": low,
            "close": close, "volume": volume,
        })

    HISTORY_CACHE[ts_code] = candles
    return candles


def generate_realtime_update(ts_code: str) -> dict:
    """生成模拟实时行情"""
    history = generate_history(ts_code)
    last = history[-1] if history else {"close": 30.0}

    last_price = LATEST_PRICES.get(ts_code, {}).get("close", last["close"])
    change_pct = random.uniform(-0.01, 0.01)
    new_close = round(last_price * (1 + change_pct), 2)
    new_open = round(last_price * random.uniform(0.998, 1.002), 2)
    new_high = round(max(new_open, new_close) * random.uniform(1.0, 1.01), 2)
    new_low = round(min(new_open, new_close) * random.uniform(0.99, 1.0), 2)
    volume = random.randint(50000, 500000)

    data = {
        "stock_code": ts_code,
        "price": new_close,
        "change": round(new_close - new_open, 2),
        "change_pct": round(change_pct * 100, 2),
        "volume": volume,
        "open": new_open,
        "high": new_high,
        "low": new_low,
        "amount": round(new_close * volume, 2),
        "timestamp": int(time.time()),
        # 模拟技术指标（基于最新价格）
        "sma_5": round(new_close * random.uniform(0.98, 1.02), 2),
        "sma_10": round(new_close * random.uniform(0.96, 1.04), 2),
        "sma_20": round(new_close * random.uniform(0.95, 1.05), 2),
        "sma_30": round(new_close * random.uniform(0.94, 1.06), 2),
        "ema_12": round(new_close * random.uniform(0.99, 1.01), 2),
        "ema_26": round(new_close * random.uniform(0.98, 1.02), 2),
        "rsi": round(random.uniform(30, 75), 1),
        "macd": round(random.uniform(-0.5, 1.5), 3),
        "macd_signal": round(random.uniform(-0.3, 1.2), 3),
        "macd_hist": round(random.uniform(-0.2, 0.5), 3),
        "boll_upper": round(new_close * 1.03, 2),
        "boll_mid": round(new_close * 1.0, 2),
        "boll_lower": round(new_close * 0.97, 2),
        "golden_cross": random.random() < 0.05,
        "death_cross": random.random() < 0.03,
        "trend": random.choice(["up", "down", "neutral"]),
        "deviation_5": round(random.uniform(-3, 3), 2),
    }

    LATEST_PRICES[ts_code] = data
    return data


# ─── WebSocket 处理 ───────────────────────────────────────────────────────────
CLIENT_COUNTER = 0


async def websocket_handler(websocket: WebSocket, path: str):
    global CLIENT_COUNTER
    CLIENT_COUNTER += 1
    client_id = f"client_{CLIENT_COUNTER}"

    await websocket.accept()
    CONNECTED_CLIENTS[client_id] = websocket
    logger.info(f"[WS] 客户端连接: {client_id}，当前: {len(CONNECTED_CLIENTS)}")

    # 发送连接确认
    await websocket.send_json({"type": "connected", "status": "ok", "server_time": int(time.time())})

    # 启动推送任务
    push_task = asyncio.create_task(push_loop(client_id, websocket))

    try:
        async for raw in websocket.iter_text():
            try:
                msg = json.loads(raw)
                await handle_client_message(client_id, msg, websocket)
            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "code": 400, "message": "Invalid JSON"})
    except WebSocketDisconnect:
        logger.info(f"[WS] 客户端断开: {client_id}")
    except Exception as e:
        logger.error(f"[WS] 处理错误 {client_id}: {e}")
    finally:
        push_task.cancel()
        CONNECTED_CLIENTS.pop(client_id, None)
        # 清理订阅
        for stocks in STOCK_SUBSCRIPTIONS.values():
            stocks.discard(client_id)


async def handle_client_message(client_id: str, msg: dict, websocket: WebSocket):
    """处理客户端消息"""
    msg_type = msg.get("type", "")

    if msg_type == "subscribe":
        data = msg.get("data", {})
        ts_codes = data.get("ts_code") or data.get("ts_codes") or []
        if isinstance(ts_codes, str):
            ts_codes = [ts_codes]

        # 记录订阅
        for code in ts_codes:
            if code not in STOCK_SUBSCRIPTIONS:
                STOCK_SUBSCRIPTIONS[code] = set()
            STOCK_SUBSCRIPTIONS[code].add(client_id)

        # 立即发送历史数据快照
        for code in ts_codes:
            history = generate_history(code, 120)
            await websocket.send_json({
                "type": "history_data",
                "data": {"ts_code": code, "candles": history[-60:]},
            })

        # 发送订阅确认
        await websocket.send_json({
            "type": "subscribe_ack",
            "data": {"ts_code": ts_codes if len(ts_codes) == 1 else ts_codes, "subscribed": True},
        })

        logger.info(f"[WS] {client_id} 订阅: {ts_codes}")

    elif msg_type == "unsubscribe":
        data = msg.get("data", {})
        ts_codes = data.get("ts_code") or []
        if isinstance(ts_codes, str):
            ts_codes = [ts_codes]
        for code in ts_codes:
            STOCK_SUBSCRIPTIONS.get(code, set()).discard(client_id)
        await websocket.send_json({
            "type": "unsubscribe_ack",
            "data": {"ts_code": ts_codes},
        })

    elif msg_type == "heartbeat":
        await websocket.send_json({"type": "heartbeat_ack", "status": "ok"})


async def push_loop(client_id: str, websocket: WebSocket):
    """定时推送实时行情"""
    try:
        while True:
            await asyncio.sleep(3)  # 每3秒推送一次

            # 推送所有订阅股票的实时数据
            for code, subscribers in list(STOCK_SUBSCRIPTIONS.items()):
                if client_id in subscribers:
                    data = generate_realtime_update(code)
                    await websocket.send_json({
                        "type": "realtime_data",
                        "data": {
                            "ts_code": code,
                            "price": {
                                "ts_code": code,
                                "timestamp": data["timestamp"],
                                "open": data["open"],
                                "high": data["high"],
                                "low": data["low"],
                                "close": data["price"],
                                "volume": data["volume"],
                                "amount": data["amount"],
                                "change": data["change"],
                                "pct_chg": data["change_pct"],
                            },
                            "indicators": {
                                "sma5": data["sma_5"], "sma10": data["sma_10"],
                                "sma20": data["sma_20"], "sma60": data.get("sma_30"),
                                "ema12": data["ema_12"], "ema26": data["ema_26"],
                                "rsi": data["rsi"],
                                "macd": data["macd"], "macd_signal": data["macd_signal"],
                                "macd_hist": data["macd_hist"],
                                "bb_upper": data["boll_upper"],
                                "bb_middle": data["boll_mid"],
                                "bb_lower": data["boll_lower"],
                            },
                        },
                    })

            # 随机推送预警（5%概率/次）
            if random.random() < 0.05:
                subscribed_codes = list(STOCK_SUBSCRIPTIONS.keys())
                if subscribed_codes:
                    code = random.choice(subscribed_codes)
                    alert_types = ["RSI超买", "RSI超卖", "金叉", "死叉", "均线偏离"]
                    alert_type = random.choice(alert_types)
                    rsi_val = round(random.uniform(25, 80), 1)
                    await websocket.send_json({
                        "type": "alert",
                        "data": {
                            "ts_code": code,
                            "stock_name": STOCK_NAMES.get(code, code),
                            "alert_type": alert_type,
                            "message": f"{STOCK_NAMES.get(code, code)} [{code}] {alert_type}！"
                                       f"{'RSI=' + str(rsi_val) if 'RSI' in alert_type else ''}",
                            "level": "warning" if alert_type in ["金叉", "死叉"] else "critical",
                            "timestamp": int(time.time() * 1000),
                        },
                    })
    except asyncio.CancelledError:
        pass


# ─── FastAPI 应用 ────────────────────────────────────────────────────────────
app = FastAPI(title="竹林司马 API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.websocket("/")
async def websocket_root(websocket: WebSocket):
    """根路径 WebSocket，与前端 ws://localhost:8765 对齐"""
    await websocket_handler(websocket, "/")


@app.websocket("/ws")
async def websocket_ws(websocket: WebSocket):
    """/ws 路径 WebSocket 备用"""
    await websocket_handler(websocket, "/ws")


@app.get("/api/health")
async def health():
    return {"status": "ok", "server": "zhulinsma-backend", "time": int(time.time())}


@app.get("/api/history/{ts_code}")
async def get_history(ts_code: str, days: int = 120):
    """获取历史K线数据"""
    candles = generate_history(ts_code, days)
    return {
        "ts_code": ts_code,
        "name": STOCK_NAMES.get(ts_code, ts_code),
        "total": len(candles),
        "data": candles,
    }


@app.get("/api/realtime/{ts_code}")
async def get_realtime(ts_code: str):
    """获取实时行情快照"""
    data = generate_realtime_update(ts_code)
    return {
        "ts_code": ts_code,
        "name": STOCK_NAMES.get(ts_code, ts_code),
        "price": {
            "ts_code": ts_code,
            "timestamp": data["timestamp"],
            "open": data["open"],
            "high": data["high"],
            "low": data["low"],
            "close": data["price"],
            "volume": data["volume"],
            "amount": data["amount"],
            "change": data["change"],
            "pct_chg": data["change_pct"],
        },
        "indicators": {
            "sma5": data["sma_5"], "sma10": data["sma_10"],
            "sma20": data["sma_20"], "sma60": data.get("sma_30"),
            "ema12": data["ema_12"], "ema26": data["ema_26"],
            "rsi": data["rsi"],
            "macd": data["macd"], "macd_signal": data["macd_signal"],
            "macd_hist": data["macd_hist"],
            "bb_upper": data["boll_upper"],
            "bb_middle": data["boll_mid"],
            "bb_lower": data["boll_lower"],
        },
    }


@app.get("/api/stocks/search")
async def search_stocks(q: str = ""):
    """搜索股票"""
    results = [
        {"ts_code": code, "name": name}
        for code, name in STOCK_NAMES.items()
        if q.lower() in name.lower() or q.lower() in code.lower()
    ]
    return {"query": q, "results": results}


@app.get("/api/stocks/list")
async def list_stocks():
    """获取股票列表"""
    return {
        "stocks": [{"ts_code": code, "name": name} for code, name in STOCK_NAMES.items()]
    }


# ─── 启动 ────────────────────────────────────────────────────────────────────
async def main():
    import uvicorn
    config = uvicorn.Config(
        app,
        host="0.0.0.0",
        port=8765,
        log_level="info",
    )
    server = uvicorn.Server(config)
    await server.serve()


if __name__ == "__main__":
    print("=" * 60)
    print("  竹林司马后端服务器 v2.0")
    print("  REST API:  http://localhost:8765")
    print("  WebSocket: ws://localhost:8765/ws")
    print("=" * 60)
    asyncio.run(main())
