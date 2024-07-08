document.addEventListener("DOMContentLoaded", () => {
    // DOM 요소 선택
    const loginForm = document.getElementById("loginForm");
    const loginBtn = document.getElementById("loginBtn");
    const studentContent = document.getElementById("studentContent");
    const adminContent = document.getElementById("adminContent");
    const wordElement = document.getElementById("word");
    const meaningElement = document.getElementById("meaning");
    const progressBar = document.getElementById("progressBar");
    const quizSection = document.getElementById("quiz");
    const quizWordElement = document.getElementById("quizWord");
    const choicesContainer = document.getElementById("choices");
    const quizFeedback = document.getElementById("quizFeedback");
    const quizProgressBar = document.getElementById("quizProgressBar");
    const uploadWordFileBtn = document.getElementById("uploadWordFile");
    const downloadWordFileBtn = document.getElementById("downloadWordFile");
    const wordFileInput = document.getElementById("wordFileInput");
    const studentTableBody = document.getElementById("studentTableBody");
    const newStudentNameInput = document.getElementById("newStudentName");
    const addStudentBtn = document.getElementById("addStudentBtn");

    // 변수 초기화
    let words = [];
    let currentIndex = 0;
    const wordsPerDay = 20;
    let quizWords = [];
    let quizIndex = 0;
    let speechSynthesisUtterance;
    let correctAnswers = 0;
    let currentStudent = null;

    // 학생 데이터 관리
    let students = JSON.parse(localStorage.getItem('students')) || [];

    // 효과음 추가
    const correctSound = new Audio('correct.wav');
    const wrongSound = new Audio('wrong.wav');

    // 이벤트 리스너 추가
    loginBtn.addEventListener("click", handleLogin);
    uploadWordFileBtn.addEventListener("click", handleWordFileUpload);
    downloadWordFileBtn.addEventListener("click", handleWordFileDownload);
    addStudentBtn.addEventListener("click", addStudent);
    wordElement.addEventListener("click", nextWord);
    document.addEventListener("keydown", handleKeyPress);

    // 로그인 처리 함수
    function handleLogin(event) {
        event.preventDefault();
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        const userType = document.getElementById("userType").value;

        if (username && password) {
            loginForm.style.display = "none";
            if (userType === "student") {
                handleStudentLogin(username);
            } else if (userType === "admin") {
                adminContent.style.display = "block";
                loadAdminContent();
            }
        } else {
            alert("사용자 이름과 비밀번호를 입력해주세요.");
        }
    }

    // 학생 로그인 처리
    function handleStudentLogin(username) {
        const student = students.find(s => s.name === username);
        if (student) {
            currentStudent = student;
            studentContent.style.display = "block";
            loadStudentContent();
        } else {
            alert("등록되지 않은 학생입니다.");
            loginForm.style.display = "block";
        }
    }

    // 학생용 콘텐츠 로드
    function loadStudentContent() {
        loadWordData();
    }

    // 관리자용 콘텐츠 로드
    function loadAdminContent() {
        displayStudentData();
    }

    // 단어 데이터 로드
    function loadWordData() {
        const wordData = JSON.parse(localStorage.getItem('wordData'));
        if (wordData) {
            words = wordData;
            showWord(currentIndex);
        } else {
            alert('단어 데이터가 없습니다. 관리자에게 문의하세요.');
        }
    }

    // 단어 파일 업로드 처리
    function handleWordFileUpload() {
        if (wordFileInput.files.length > 0) {
            const file = wordFileInput.files[0];
            const reader = new FileReader();

            reader.onload = function(e) {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, {type: 'array'});
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, {header: 1});

                localStorage.setItem('wordData', JSON.stringify(jsonData));
                alert('단어 파일이 성공적으로 업로드되었습니다.');
            };

            reader.readAsArrayBuffer(file);
        } else {
            alert('파일을 선택해주세요.');
        }
    }

    // 단어 파일 다운로드 처리
    function handleWordFileDownload() {
        const wordData = JSON.parse(localStorage.getItem('wordData'));
        if (wordData) {
            const ws = XLSX.utils.json_to_sheet(wordData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Words");
            XLSX.writeFile(wb, "current_words.xlsx");
        } else {
            alert('다운로드할 단어 데이터가 없습니다.');
        }
    }

    // 학생 데이터 표시
    function displayStudentData() {
        studentTableBody.innerHTML = '';
        students.forEach((student, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.name}</td>
                <td>${displayStudentProgress(student)}</td>
                <td>${displayStudentQuizAccuracy(student)}</td>
                <td>
                    <button onclick="editStudent(${index})">수정</button>
                    <button onclick="deleteStudent(${index})">삭제</button>
                </td>
            `;
            studentTableBody.appendChild(row);
        });
    }

    // 학생 진도 표시
    function displayStudentProgress(student) {
        if (!student.learningHistory) return '학습 기록 없음';
        const latestSession = student.learningHistory[student.learningHistory.length - 1];
        return `${latestSession.progress}% (${student.learningHistory.length}회차)`;
    }

    // 학생 퀴즈 정확도 표시
    function displayStudentQuizAccuracy(student) {
        if (!student.learningHistory) return '퀴즈 기록 없음';
        const latestSession = student.learningHistory[student.learningHistory.length - 1];
        return `${latestSession.quizAccuracy}% (${student.learningHistory.length}회차)`;
    }

    // 학생 추가
    function addStudent() {
        const name = newStudentNameInput.value.trim();
        if (name) {
            students.push({ name: name, learningHistory: [] });
            saveStudents();
            displayStudentData();
            newStudentNameInput.value = '';
        } else {
            alert('학생 이름을 입력해주세요.');
        }
    }

    // 학생 수정
    window.editStudent = function(index) {
        const newName = prompt("새로운 이름을 입력하세요:", students[index].name);
        if (newName !== null) {
            students[index].name = newName.trim();
            saveStudents();
            displayStudentData();
        }
    }

    // 학생 삭제
    window.deleteStudent = function(index) {
        if (confirm("정말로 이 학생을 삭제하시겠습니까?")) {
            students.splice(index, 1);
            saveStudents();
            displayStudentData();
        }
    }

    // 학생 데이터 저장
    function saveStudents() {
        localStorage.setItem('students', JSON.stringify(students));
    }

    // 단어 표시 함수
    function showWord(index) {
        if (index < Math.min(words.length, wordsPerDay)) {
            wordElement.textContent = words[index][0];
            meaningElement.textContent = words[index][1];
            updateProgressBar(index, wordsPerDay);
            speakWord(words[index][0]);
        } else {
            startQuiz();
        }
    }

    // 진행 바 업데이트 함수
    function updateProgressBar(index, total) {
        const progress = ((index + 1) / total) * 100;
        progressBar.style.width = progress + "%";
    }

    // 단어 발음 함수
    function speakWord(word) {
        if (speechSynthesisUtterance) {
            speechSynthesisUtterance.onend = null;
            speechSynthesis.cancel();
        }

        speechSynthesisUtterance = new SpeechSynthesisUtterance(word);
        speechSynthesisUtterance.lang = 'en-US';
        speechSynthesis.speak(speechSynthesisUtterance);
    }

    // 다음 단어로 이동 함수
    function nextWord() {
        speechSynthesis.cancel();
        currentIndex++;
        showWord(currentIndex);
    }

    // 키 입력 처리 함수
    function handleKeyPress(e) {
        if (e.code === "Space") {
            e.preventDefault();
            nextWord();
        }
    }

    // 퀴즈 시작 함수
    function startQuiz() {
        wordElement.style.display = 'none';
        meaningElement.style.display = 'none';
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
            quizWordElement.textContent = currentWord[0];
            speakWord(currentWord[0]);
            
            const correctAnswer = currentWord[1];
            const choices = [correctAnswer];
            while (choices.length < 4) {
                const randomChoice = words[Math.floor(Math.random() * words.length)][1];
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
        const feedbackElement = document.createElement('div');
        feedbackElement.className = 'feedback';
        
        if (selectedAnswer === correctAnswer) {
            feedbackElement.textContent = '정답입니다!';
            feedbackElement.classList.add('correct');
            correctSound.play();
            correctAnswers++;
        } else {
            feedbackElement.textContent = `오답입니다! 정답: ${correctAnswer}`;
            feedbackElement.classList.add('wrong');
            wrongSound.play();
        }
        
        document.body.appendChild(feedbackElement);
        
        setTimeout(() => {
            document.body.removeChild(feedbackElement);
            quizIndex++;
            showQuizWord(quizIndex);
        }, 1500);
    }

    // 퀴즈 결과 표시 함수
    function showQuizResults() {
        updateStudentProgress();
        quizSection.innerHTML = `
            <h2>퀴즈가 종료되었습니다.</h2>
            <p>맞춘 개수: ${correctAnswers} / ${quizWords.length}</p>
            <button id="restartBtn">다시 시작</button>
            <button id="reviewBtn">복습하기</button>
        `;
        document.getElementById("restartBtn").addEventListener("click", restartQuiz);
        document.getElementById("reviewBtn").addEventListener("click", startReviewMode);
    }

    // 학생 진도 및 퀴즈 정확도 업데이트
    function updateStudentProgress() {
        if (currentStudent) {
            const progress = Math.round((currentIndex / words.length) * 100);
            const quizAccuracy = Math.round((correctAnswers / quizWords.length) * 100);
            
            if (!currentStudent.learningHistory) {
                currentStudent.learningHistory = [];
            }
            
            currentStudent.learningHistory.push({
                date: new Date().toISOString(),
                progress: progress,
                quizAccuracy: quizAccuracy
            });

            saveStudents();
        }
    }

    // 퀴즈 다시 시작 함수
    function restartQuiz() {
        currentIndex = 0;
        loadStudentContent();
    }

    // 복습 모드 시작 함수
    function startReviewMode() {
        quizSection.style.display = 'none';
        wordElement.style.display = 'block';
        meaningElement.style.display = 'block';
        currentIndex = 0;
        showWord(currentIndex);
    }

    // 배열 섞기 함수
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }}

        // 관리자 대시보드에 학생별 상세 통계 표시 함수
        function showStudentDetailedStats(studentIndex) {
            const student = students[studentIndex];
            let statsHTML = `<h3>${student.name}의 학습 통계</h3>`;
            
            if (student.learningHistory && student.learningHistory.length > 0) {
                statsHTML += '<table><tr><th>회차</th><th>날짜</th><th>진도</th><th>퀴즈 정확도</th></tr>';
                student.learningHistory.forEach((session, index) => {
                    const date = new Date(session.date).toLocaleDateString();
                    statsHTML += `<tr>
                        <td>${index + 1}</td>
                        <td>${date}</td>
                        <td>${session.progress}%</td>
                        <td>${session.quizAccuracy}%</td>
                    </tr>`;
                });
                statsHTML += '</table>';
            } else {
                statsHTML += '<p>학습 기록이 없습니다.</p>';
            }
    
            const detailsElement = document.getElementById('studentDetails');
            detailsElement.innerHTML = statsHTML;
            detailsElement.style.display = 'block';
        }
    
        // 초기화 함수
        function init() {
            loadWordData();
            if (currentStudent) {
                loadStudentContent();
            } else {
                loadAdminContent();
            }
        }
    
        // 초기화 실행
        init();
    });