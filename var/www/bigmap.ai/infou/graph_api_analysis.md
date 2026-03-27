# InfoU 그래프/트렌드 API 심층 분석 보고서

InfoU SCADA 시스템에서 그래프 및 트렌드 표시를 담당하는 핵심 컴포넌트의 기술 분석입니다.

---

## 1. 식별된 그래프 관련 컴포넌트

| 컴포넌트 | 유형 | 역할 |
|----------|------|------|
| `iuGraphPro.ocx` | ActiveX/OCX | InfoU 전용 고급 그래프/트렌드 컨트롤 |
| `TeeChart2012.ocx` | ActiveX/OCX | Steema Software의 범용 차트 엔진 (v2012) |
| `GrapeCity.ActiveReports.Chart.v9.dll` | .NET DLL | GrapeCity의 리포트 내장 차트 (ActiveReports v9) |

## 2. 컴포넌트별 기술 분석

### 2.1 iuGraphPro.ocx (InfoU 전용)
- **유형**: LS ELECTRIC 자체 개발 ActiveX 컨트롤
- **용도**: 실시간 트렌드 모니터링, 히스토리컬 데이터 표시
- **다국어 지원**: `iuGraphProENU.lng` (영어), `iuGraphProCHS.lng` (중국어) 존재
- **연동 방식**: InfoU Designer의 화면에 드래그&드롭으로 배치, 스크립트에서 프로퍼티/메서드 호출

#### 추정 API 구조 (ActiveX 표준 패턴 기반):
```
[프로퍼티]
- TagName: 연결할 태그 이름
- TimeRange: 표시 시간 범위
- UpdateInterval: 갱신 주기 (ms)
- LineColor / LineWidth: 선 색상 및 두께
- YAxisMin / YAxisMax: Y축 범위
- ShowLegend: 범례 표시 여부

[메서드]
- AddTag(tagName, color): 트렌드에 태그 추가
- RemoveTag(tagName): 태그 제거
- SetTimeRange(start, end): 시간 범위 설정
- ExportToImage(filePath): 이미지로 내보내기
- Refresh(): 강제 갱신

[이벤트]
- OnDataUpdate: 데이터 갱신 시 발생
- OnClick: 클릭 이벤트
```

### 2.2 TeeChart2012.ocx (Steema Software)
- **유형**: 상용 ActiveX 차트 엔진
- **용도**: 고급 차트 유형 (바, 라인, 파이, 3D 등) 지원
- **공식 문서**: [Steema TeeChart 문서](https://www.steema.com/teechart/activex)

#### 주요 API (공식 문서 기반):
```
[핵심 객체]
- TChart: 메인 차트 객체
- Series: 데이터 시리즈 컬렉션
- Axis: 축 설정
- Legend: 범례 설정

[주요 메서드]
- AddSeries(seriesType): 시리즈 추가
- Series(index).Add(value, label, color): 데이터 포인트 추가
- Export.SaveToFile(format, path): 파일 내보내기
- Print(): 인쇄

[프로퍼티]
- Chart.Title.Text: 차트 제목
- Series(i).Color: 시리즈 색상
- Axis.Left.Minimum / Maximum: 좌축 범위
```

### 2.3 GrapeCity ActiveReports Chart v9
- **유형**: .NET 기반 리포트 차트
- **용도**: `iuActiveReportViewer.exe`에서 보고서 내 차트 렌더링
- **특징**: 리포트 출력 전용이므로 실시간 트렌드와는 별개

## 3. AI 브릿지를 통한 현대화 방안

Python에서 InfoU 그래프 컨트롤을 제어하는 개념적 브릿지 코드:

```python
import win32com.client

# InfoU 그래프 컨트롤 인스턴스 생성
graph = win32com.client.Dispatch("InfoU.GraphPro")

# 태그 추가 및 표시 설정
graph.AddTag("Tank01_Level", 0x0000FF)  # 파란색
graph.AddTag("Tank01_Temp", 0xFF0000)   # 빨간색

# 시간 범위 설정 (최근 1시간)
graph.SetTimeRange("2026-03-08 03:00", "2026-03-08 04:00")

# 이미지 내보내기
graph.ExportToImage("c:/InfoU/trend_snapshot.png")
```

> ⚠️ **참고**: 위 코드는 ActiveX 표준 패턴에 기반한 추정 코드입니다. 실제 ProgID와 메서드명은 `iuGraphPro.ocx`의 TypeLib 분석을 통해 확인해야 합니다.

## 4. 권장 후속 작업

- `OleView` 또는 `oleautomation` 도구로 `iuGraphPro.ocx`의 타입 라이브러리(TypeLib)를 추출하면 정확한 인터페이스 사양을 확인할 수 있습니다.
- 안티그래비티에게 추출된 TypeLib 분석을 요청하면 자동으로 Python/C# 래퍼 클래스를 생성할 수 있습니다.
