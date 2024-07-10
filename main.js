document.addEventListener("DOMContentLoaded", () => {
    // ... (이전 코드는 그대로 유지)

    // Excel 파일에서 단어 데이터 로드
    async function loadWordData() {
        try {
            const response = await fetch('https://cors-anywhere.herokuapp.com/https://raw.githubusercontent.com/leeseokjoong/subrain/main/predefined_words.xlsx');
            const arrayBuffer = await response.arrayBuffer();
            const data = new Uint8Array(arrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            words = XLSX.utils.sheet_to_json(sheet, { header: ['word', 'meaning'] });
            words.shift(); // 첫 번째 행(헤더)을 제거합니다
            showWord(currentIndex);
        } catch (error) {
            console.error('Error loading word data:', error);
            alert('단어 데이터를 불러오는 데 실패했습니다. 나중에 다시 시도해주세요.');
            wordElement.textContent = "데이터 로드 실패";
            meaningElement.textContent = "페이지를 새로고침 해주세요";
        }
    }

    // ... (나머지 코드는 그대로 유지)

    // 초기화 함수
    function init() {
        wordElement.textContent = "데이터 로딩 중...";
        meaningElement.textContent = "잠시만 기다려주세요";
        loadWordData();
    }

    // 초기화 실행
    init();
});
