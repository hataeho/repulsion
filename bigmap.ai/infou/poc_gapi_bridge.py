"""
InfoU GAPI32.DLL Bridge PoC - Python 기반 태그 제어 프로토타입
작성자: 하태호 (bigmap@bigmap.ai)
목적: InfoU의 기존 DLL을 현대적 언어에서 직접 호출할 수 있음을 증명
"""
import ctypes
import os

dll_path = r"c:\InfoU\bin\GAPI32.DLL"

if not os.path.exists(dll_path):
    print(f"[ERROR] DLL not found: {dll_path}")
else:
    print(f"[OK] DLL found: {dll_path} ({os.path.getsize(dll_path):,} bytes)")
    
    try:
        gapi = ctypes.WinDLL(dll_path)
        print(f"[OK] DLL loaded successfully")
        
        test_functions = [
            'GAPI_Connect', 'GAPI_ReadTag', 'GAPI_WriteTag',
            'Connect', 'ReadTag', 'WriteTag',
            'GAPIConnect', 'GAPIReadTag', 'GAPIWriteTag',
        ]
        
        found_funcs = []
        for func_name in test_functions:
            try:
                func = getattr(gapi, func_name)
                found_funcs.append(func_name)
                print(f"  [FOUND] {func_name}: {func}")
            except AttributeError:
                pass
        
        if not found_funcs:
            print("  [INFO] 표준 이름 패턴으로는 함수를 찾지 못했습니다.")
            print("  [INFO] dumpbin /exports 도구로 정확한 이름을 확인하세요.")
        
    except OSError as e:
        print(f"[WARN] DLL load failed: {e}")
        print(f"[INFO] 의존성 DLL이 누락되었을 수 있습니다.")

print("\n=== PoC 결론 ===")
print("DLL 로드 가능 여부와 Export 함수 존재 여부를 확인했습니다.")
