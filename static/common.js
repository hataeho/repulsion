// 공통 유틸리티 모음

/**
 * 전역 API 호출 함수
 * @param {string} url - 호출할 API 주소
 * @param {string} method - HTTP 메서드 (기본 GET)
 * @param {object} body - 전송할 JSON Payload
 */
async function api(url, method = 'GET', body = null) {
  const o = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) o.body = JSON.stringify(body);
  const r = await fetch(url, o);
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    let msg = e.detail || '오류';
    if (typeof msg === 'object') {
      msg = JSON.stringify(msg);
    }
    throw new Error(msg);
  }
  return r.json();
}

/**
 * 숫자 콤마 표시 포맷팅
 */
function fmt(n) {
  return n != null ? Number(n).toLocaleString('ko-KR') : '0';
}

/**
 * 모달 창 열기
 */
function openModal(id) {
  document.getElementById(id).classList.add('active');
}

/**
 * 모달 창 닫기
 */
function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

/**
 * 팝업 알림 표시 (Toast)
 */
function toast(m, t = 'success') {
  const e = document.createElement('div');
  e.className = 'toast toast-' + t;
  e.textContent = m;
  document.body.appendChild(e);
  setTimeout(() => e.remove(), 3000);
}
