import os
import shutil
import time

# 현재 스크립트가 위치한 폴더를 작업 디렉토리로 설정
WORK_DIR = os.path.dirname(os.path.abspath(__file__))

# 1단계: 테스트용 더미 파일 여러 개 생성 (확장자가 뒤섞인 환경 모방)
dummy_files = [
    "report_jan.pdf", "data_sales.csv", "photo_vacation.jpg",
    "notes_meeting.txt", "invoice_001.pdf", "logo.png",
    "todo_list.txt", "metrics_q1.csv"
]

print("🛠️ 1. 뒤섞인 테스트용 더미 파일 생성 중...")
for f in dummy_files:
    file_path = os.path.join(WORK_DIR, f)
    with open(file_path, "w") as tf:
        tf.write("dummy content")
    print(f"  새 파일 생성: {f}")

time.sleep(1)

# 2단계: 에이전트 분류 작업 (파일 확장자 기반 폴더 이동)
print("\n🤖 2. 안티그래비티 파일 분류 에이전트 가동 시작!")
def sort_files_by_extension(directory):
    files = [f for f in os.listdir(directory) if os.path.isfile(os.path.join(directory, f)) and f != os.path.basename(__file__)]
    
    for file in files:
        ext = file.split('.')[-1].lower()
        if not ext: continue
        
        # 확장자별 대상 폴더 이름 설정
        target_folder_name = f"{ext}_files"
        target_folder_path = os.path.join(directory, target_folder_name)
        
        # 대상 폴더가 없으면 생성
        if not os.path.exists(target_folder_path):
            os.makedirs(target_folder_path)
            print(f"  새 폴더 생성됨: [{target_folder_name}]")
            
        # 파일 이동
        src_path = os.path.join(directory, file)
        dest_path = os.path.join(target_folder_path, file)
        shutil.move(src_path, dest_path)
        print(f"  ➤ 이동 완료: {file} -> {target_folder_name}/")

sort_files_by_extension(WORK_DIR)
print("\n✅ 3. 분류 작업 종료. 폴더가 깨끗하게 정리되었습니다.")
