/**
 * 전국 송전 여유용량 지도 - 메인 애플리케이션
 */

// ========== 전역 변수 ==========
let map;
let markerLayer;
let lineLayer;
let markers = [];

// ========== 유틸리티 ==========
function getStatus(capacity) {
    if (capacity >= 100) return 'green';
    if (capacity >= 30) return 'yellow';
    return 'red';
}

function getStatusLabel(capacity) {
    if (capacity >= 100) return '여유';
    if (capacity >= 30) return '보통';
    return '포화';
}

function getStatusColor(status) {
    const colors = {
        green: '#00E676',
        yellow: '#FFD600',
        red: '#FF5252'
    };
    return colors[status] || '#888';
}

function getUsagePercent(sub) {
    return Math.round((sub.usedCapacity / sub.totalCapacity) * 100);
}

// ========== 커스텀 마커 생성 ==========
function createMarkerIcon(sub) {
    const status = getStatus(sub.availableCapacity);
    const color = getStatusColor(status);
    const size = sub.voltage >= 345 ? 18 : 13;
    const border = sub.voltage >= 345 ? 3 : 2;

    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            border: ${border}px solid rgba(255,255,255,0.25);
            border-radius: 50%;
            box-shadow: 0 0 ${size}px ${color}88, 0 0 ${size * 2}px ${color}44;
            animation: pulse-${status} 2s infinite;
            cursor: pointer;
        "></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
    });
}

// ========== 팝업 콘텐츠 ==========
function createPopupContent(sub) {
    const status = getStatus(sub.availableCapacity);
    const color = getStatusColor(status);
    const label = getStatusLabel(sub.availableCapacity);
    const usage = getUsagePercent(sub);

    return `
        <div class="popup-content">
            <h4>${sub.name}</h4>
            <div class="popup-row"><span>위치</span><span>${sub.province}</span></div>
            <div class="popup-row"><span>전압등급</span><span>${sub.voltage}kV</span></div>
            <div class="popup-row"><span>총 용량</span><span>${sub.totalCapacity} MW</span></div>
            <div class="popup-row"><span>사용 용량</span><span>${sub.usedCapacity} MW</span></div>
            <div class="popup-row"><span>여유 용량</span><span style="color:${color};font-weight:700">${sub.availableCapacity} MW</span></div>
            <div class="popup-row"><span>사용률</span><span>${usage}%</span></div>
            <div class="popup-row"><span>차단기</span><span>${sub.breakers.used}/${sub.breakers.total} 사용</span></div>
            <div class="popup-row"><span>태양광 대기</span><span>${sub.solarPending} MW</span></div>
            <div class="popup-status" style="background:${color}22;color:${color};border:1px solid ${color}44">
                ${label} (여유 ${sub.availableCapacity}MW)
            </div>
        </div>
    `;
}

// ========== 상세 패널 ==========
function showDetail(sub) {
    const panel = document.getElementById('detail-panel');
    const content = document.getElementById('detail-content');
    const status = getStatus(sub.availableCapacity);
    const color = getStatusColor(status);
    const label = getStatusLabel(sub.availableCapacity);
    const usage = getUsagePercent(sub);
    const barWidth = 100 - usage;

    let recClass, recText;
    if (status === 'green') {
        recClass = 'rec-good';
        recText = '✅ 태양광 사업 입지로 적합합니다. 충분한 여유 용량이 있습니다.';
    } else if (status === 'yellow') {
        recClass = 'rec-caution';
        recText = '⚠️ 접속 가능하나, 한전 지사에 정확한 잔여 용량 확인 필요합니다.';
    } else {
        recClass = 'rec-warning';
        recText = '🚫 계통 포화 상태입니다. 접속 대기가 길어질 수 있습니다.';
    }

    content.innerHTML = `
        <div class="detail-name">${sub.name}</div>
        <div class="detail-row"><span class="detail-key">위치</span><span class="detail-val">${sub.province}</span></div>
        <div class="detail-row"><span class="detail-key">전압</span><span class="detail-val">${sub.voltage}kV</span></div>
        <div class="detail-row"><span class="detail-key">총 용량</span><span class="detail-val">${sub.totalCapacity} MW</span></div>
        <div class="detail-row"><span class="detail-key">사용 용량</span><span class="detail-val">${sub.usedCapacity} MW (${usage}%)</span></div>
        <div class="detail-row"><span class="detail-key">여유 용량</span><span class="detail-val" style="color:${color}">${sub.availableCapacity} MW</span></div>
        <div class="detail-row"><span class="detail-key">차단기</span><span class="detail-val">${sub.breakers.used}/${sub.breakers.total} 사용 (예약 ${sub.breakers.reserved})</span></div>
        <div class="detail-row"><span class="detail-key">태양광 대기</span><span class="detail-val">${sub.solarPending} MW</span></div>
        <div class="capacity-bar">
            <div class="capacity-bar-fill" style="width:${barWidth}%;background:${color}"></div>
        </div>
        <div class="recommendation ${recClass}">${recText}</div>
    `;

    panel.style.display = 'block';
}

// ========== 송전선로 그리기 ==========
function drawTransmissionLines() {
    lineLayer.clearLayers();

    const subMap = {};
    SUBSTATIONS.forEach(s => { subMap[s.name] = s; });

    TRANSMISSION_LINES.forEach(line => {
        const from = subMap[line.from];
        const to = subMap[line.to];
        if (!from || !to) return;

        const fromStatus = getStatus(from.availableCapacity);
        const toStatus = getStatus(to.availableCapacity);

        // 두 변전소 중 더 나쁜 상태를 선로 색상으로
        let lineColor;
        if (fromStatus === 'red' || toStatus === 'red') {
            lineColor = '#FF525266';
        } else if (fromStatus === 'yellow' || toStatus === 'yellow') {
            lineColor = '#FFD60044';
        } else {
            lineColor = '#00E67644';
        }

        const weight = line.voltage >= 345 ? 2.5 : 1.5;
        const dashArray = line.voltage >= 345 ? null : '6,4';

        const polyline = L.polyline(
            [[from.lat, from.lng], [to.lat, to.lng]],
            {
                color: lineColor,
                weight: weight,
                dashArray: dashArray,
                opacity: 0.8
            }
        );

        polyline.bindTooltip(
            `${line.from} ↔ ${line.to}<br>${line.voltage}kV | ${line.capacity}MW`,
            { className: 'custom-tooltip' }
        );

        lineLayer.addLayer(polyline);
    });
}

// ========== 마커 렌더링 ==========
function renderMarkers(filteredData) {
    markerLayer.clearLayers();
    markers = [];

    filteredData.forEach(sub => {
        const marker = L.marker([sub.lat, sub.lng], {
            icon: createMarkerIcon(sub)
        });

        marker.bindPopup(createPopupContent(sub), {
            maxWidth: 260,
            closeButton: true
        });

        marker.bindTooltip(
            `<strong>${sub.name}</strong><br>여유: ${sub.availableCapacity}MW`,
            { className: 'custom-tooltip', direction: 'top', offset: [0, -10] }
        );

        marker.on('click', () => showDetail(sub));

        markerLayer.addLayer(marker);
        markers.push({ marker, data: sub });
    });

    updateStats(filteredData);
}

// ========== 통계 업데이트 ==========
function updateStats(data) {
    const total = data.length;
    const green = data.filter(s => getStatus(s.availableCapacity) === 'green').length;
    const yellow = data.filter(s => getStatus(s.availableCapacity) === 'yellow').length;
    const red = data.filter(s => getStatus(s.availableCapacity) === 'red').length;

    animateNumber('total-count', total);
    animateNumber('green-count', green);
    animateNumber('yellow-count', yellow);
    animateNumber('red-count', red);
}

function animateNumber(id, target) {
    const el = document.getElementById(id);
    const current = parseInt(el.textContent) || 0;
    const diff = target - current;
    const duration = 500;
    const steps = 20;
    const increment = diff / steps;
    let step = 0;

    const timer = setInterval(() => {
        step++;
        if (step >= steps) {
            el.textContent = target;
            clearInterval(timer);
        } else {
            el.textContent = Math.round(current + increment * step);
        }
    }, duration / steps);
}

// ========== 필터링 ==========
function applyFilters() {
    const regionFilter = document.getElementById('region-filter').value;
    const capacityFilter = document.getElementById('capacity-filter').value;
    const voltageFilter = document.getElementById('voltage-filter').value;

    let filtered = SUBSTATIONS.filter(sub => {
        // 지역 필터
        if (regionFilter !== 'all' && sub.region !== regionFilter) return false;

        // 용량 필터
        if (capacityFilter !== 'all') {
            const status = getStatus(sub.availableCapacity);
            if (capacityFilter === 'high' && status !== 'green') return false;
            if (capacityFilter === 'mid' && status !== 'yellow') return false;
            if (capacityFilter === 'low' && status !== 'red') return false;
        }

        // 전압 필터
        if (voltageFilter !== 'all') {
            if (sub.voltage !== parseInt(voltageFilter)) return false;
        }

        return true;
    });

    renderMarkers(filtered);
    drawTransmissionLines();

    // 지역 필터 시 해당 지역으로 이동
    if (regionFilter !== 'all' && filtered.length > 0) {
        const bounds = L.latLngBounds(filtered.map(s => [s.lat, s.lng]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    } else if (regionFilter === 'all') {
        map.setView([36.0, 127.8], 7);
    }
}

// ========== 지도 초기화 ==========
function initMap() {
    map = L.map('map', {
        center: [36.0, 127.8],
        zoom: 7,
        minZoom: 6,
        maxZoom: 14,
        zoomControl: true,
        attributionControl: true
    });

    // 다크 모드 타일 (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> | 데이터: 한전 공개자료 기반 참고용',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    // 레이어 그룹
    lineLayer = L.layerGroup().addTo(map);
    markerLayer = L.layerGroup().addTo(map);

    // 초기 렌더링
    renderMarkers(SUBSTATIONS);
    drawTransmissionLines();

    // 필터 이벤트
    document.getElementById('region-filter').addEventListener('change', applyFilters);
    document.getElementById('capacity-filter').addEventListener('change', applyFilters);
    document.getElementById('voltage-filter').addEventListener('change', applyFilters);
}

// ========== 앱 시작 ==========
document.addEventListener('DOMContentLoaded', initMap);
