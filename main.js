document.addEventListener("DOMContentLoaded", () => {
    // DOM 요소 선택
    const wordElement = document.getElementById("word");
    const meaningElement = document.getElementById("meaning");
    const progressBar = document.getElementById("progressBar");
    const nextBtn = document.getElementById("nextBtn");
    const wordSection = document.getElementById("wordSection");
    const quizSection = document.getElementById("quiz");
    const quizWordElement = document.getElementById("quizWord");
    const choicesContainer = document.getElementById("choices");
    const quizFeedback = document.getElementById("quizFeedback");
    const quizProgressBar = document.getElementById("quizProgressBar");
    const resultsSection = document.getElementById("results");
    const scoreElement = document.getElementById("score");
    const restartBtn = document.getElementById("restartBtn");

    // 변수 초기화
    let words = [];
    let currentIndex = 0;
    const wordsPerDay = 5; // 학습할 단어 수
    let quizWords = [];
    let quizIndex = 0;
    let correctAnswers = 0;

    // 이벤트 리스너 추가
    nextBtn.addEventListener("click", nextWord);
    restartBtn.addEventListener("click", restartQuiz);

    // Excel 파일에서 단어 데이터 로드
    async function loadWordData() {
        try {
            const response = await fetch('https://raw.githubusercontent.com/leeseokjoong/subrain/main/predefined_words.xlsx');
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
        }
    }

    // 단어 표시 함수
    function showWord(index) {
        if (index < Math.min(words.length, wordsPerDay)) {
            wordElement.textContent = words[index].word;
            meaningElement.textContent = words[index].meaning;
            updateProgressBar(index, wordsPerDay);
        } else {
            startQuiz();
        }
    }

    // 진행 바 업데이트 함수
    function updateProgressBar(index, total) {
        const progress = ((index + 1) / total) * 100;
        progressBar.style.width = progress + "%";
    }

    // 다음 단어로 이동 함수
    function nextWord() {
        currentIndex++;
        showWord(currentIndex);
    }

    // 퀴즈 시작 함수
    function startQuiz() {
        wordSection.style.display = 'none';
        quizSection.style.display = 'block';
        quizWords = words.slice(0, wordsPerDay);
        quizIndex = 0;
        correctAnswers = 0;
        showQuizWord(quizIndex);
    }

    // 퀴즈 단어 표시 함수
    function showQuizWord(index) {
        if (index < quizWords.length) {
            const currentWord = quizWords[index];
            quizWordElement.textContent = currentWord.word;
            
            const correctAnswer = currentWord.meaning;
            const choices = [correctAnswer];
            while (choices.length < 4) {
                const randomChoice = words[Math.floor(Math.random() * words.length)].meaning;
                if (!choices.includes(randomChoice)) {
                    choices.push(randomChoice);
                }
            }
            shuffleArray(choices);
            choicesContainer.innerHTML = '';
            choices.forEach(choice => {
                const choiceElement = document.createElement('div');
                choiceElement.textContent = choice;
                choiceElement.className = 'choice';
                choiceElement.addEventListener('click', () => checkAnswer(choice, correctAnswer));
                choicesContainer.appendChild(choiceElement);
            });
            quizFeedback.textContent = '';
            updateQuizProgressBar(index, quizWords.length);
        } else {
            showQuizResults();
        }
    }

    // 퀴즈 진행 바 업데이트 함수
    function updateQuizProgressBar(index, total) {
        const progress = ((index + 1) / total) * 100;
        quizProgressBar.style.width = progress + "%";
    }

    // 답변 확인 함수
    function checkAnswer(selectedAnswer, correctAnswer) {
        if (selectedAnswer === correctAnswer) {
            quizFeedback.textContent = '정답입니다!';
            quizFeedback.style.color = 'green';
            correctAnswers++;
        } else {
            quizFeedback.textContent = `오답입니다. 정답은 ${correctAnswer}입니다.`;
            quizFeedback.style.color = 'red';
        }
        
        setTimeout(() => {
            quizIndex++;
            showQuizWord(quizIndex);
        }, 1500);
    }

    // 퀴즈 결과 표시 함수
    function showQuizResults() {
        quizSection.style.display = 'none';
        resultsSection.style.display = 'block';
        scoreElement.textContent = `${quizWords.length}개 중 ${correctAnswers}개 맞았습니다.`;
    }

    // 퀴즈 다시 시작 함수
    function restartQuiz() {
        currentIndex = 0;
        resultsSection.style.display = 'none';
        wordSection.style.display = 'block';
        showWord(currentIndex);
    }

    // 배열 섞기 함수
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // 초기화 함수
    function init() {
        loadWordData();
    }

    // 초기화 실행
    init();
});
