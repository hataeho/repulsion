"""
FS-4300 저울 실시간 읽기 – MSManager JSON(TCP 13450) 방식
- 기존 SSH + SHM 대비 통신 부하 감소 및 노이즈(Tearing) 제거
- 음수 출력 지원 및 중간값 필터링을 통한 튀는 값(스파이크) 보정 추가
"""
import asyncio
import json
import logging
import socket
from typing import Callable, Optional

logger = logging.getLogger(__name__)

class ScaleReader:
    def __init__(self, host: str = "192.168.0.250", port: int = 13450):
        self.host = host
        self.port = port
        self.connected = False
        self._weight_callback: Optional[Callable[[int, bool], None]] = None
        self._task: Optional[asyncio.Task] = None

        self.current_weight = 0
        self.is_stable = False
        
        # 노이즈 필터 버퍼
        self._history = []
        self._history_size = 5  
        self._consecutive_same_weight = 0

    def on_weight(self, callback: Callable[[int, bool], None]):
        self._weight_callback = callback

    async def start(self):
        if self._task is None:
            self._task = asyncio.create_task(self._poll_loop())

    async def stop(self):
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None

    def _read_weight_via_json(self) -> Optional[float]:
        req = {
            "protocol": "ms",
            "direction": "request",
            "job": "232"
        }
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(2.0)
            s.connect((self.host, self.port))
            s.sendall(json.dumps(req).encode('utf-8'))
            
            data = s.recv(4096)
            s.close()
            
            if not data:
                return None
                
            resp = json.loads(data.decode('utf-8'))
            target_value = None
            
            for dev in resp.get("rs232", []):
                if dev.get("name") == "FS-4300":
                    val = float(dev.get("value", 0.0))
                    # 유효한 숫자 범위 (일반적인 트럭 저울 스펙 고려 및 쓰레기값 무시)
                    if abs(val) < 100000:
                        target_value = val
                        break
            
            return target_value
                
        except Exception as e:
            logger.debug(f"JSON read error: {e}")
            return None

    def _apply_filter(self, new_weight: float) -> int:
        """노이즈 제거: 이상치를 버리고 중간값 사용 (스파이크 제거)"""
        val = int(round(new_weight)) # 음수 정상 변환 포함 (-10.5 -> -10)
        
        self._history.append(val)
        if len(self._history) > self._history_size:
            self._history.pop(0)

        # 리스트 정렬 후 중간값 반환
        sorted_h = sorted(self._history)
        median = sorted_h[len(sorted_h)//2]
        return median

    async def _poll_loop(self):
        """주기적으로 JSON에서 읽기"""
        while True:
            try:
                weight_f = await asyncio.to_thread(self._read_weight_via_json)

                if weight_f is not None:
                    # 중간값 필터링 및 변환
                    weight = self._apply_filter(weight_f)
                    self.connected = True

                    if weight == self.current_weight:
                        self._consecutive_same_weight += 1
                    else:
                        self.current_weight = weight
                        self._consecutive_same_weight = 0

                    # 3번(약 1초) 같은 정수값이면 안정화
                    self.is_stable = self._consecutive_same_weight >= 3

                    if self._weight_callback:
                        self._weight_callback(self.current_weight, self.is_stable)
                else:
                    self.connected = False
                    if self._weight_callback:
                        self._weight_callback(self.current_weight, False)

                await asyncio.sleep(0.3)

            except asyncio.CancelledError:
                raise
            except Exception as e:
                self.connected = False
                logger.warning(f"Scale poll error: {e}")
                if self._weight_callback:
                    self._weight_callback(self.current_weight, False)
                await asyncio.sleep(2)

# 단독 실행 시 테스트용 진입점
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    async def main():
        reader = ScaleReader()
        
        def on_weight(w, stable):
            print(f"Weight: {w:5d} kg | Stable: {stable}")
            
        reader.on_weight(on_weight)
        await reader.start()
        
        # 10초간 테스트 수신
        await asyncio.sleep(10)
        await reader.stop()

    asyncio.run(main())
