import './style.css';

// API Configuration - OpenAI
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const API_URL = 'https://api.openai.com/v1/chat/completions';

// Game State
let gameState = {
    problem: '',
    answer: '',
    questionCount: 0,
    yesCount: 0,
    noCount: 0,
    history: [],
    isLoading: false,
    difficulty: 'easy'
};

// Difficulty configurations
const difficultyConfig = {
    easy: {
        label: '初級',
        prompt: `【難易度：初級】
- シンプルで分かりやすい状況
- 論理的な飛躍が少ない
- 5〜10回程度の質問で解ける
- 日常的なシチュエーション`
    },
    normal: {
        label: '中級',
        prompt: `【難易度：中級】
- やや複雑な状況設定
- 少しひねりのある展開
- 10〜20回程度の質問で解ける
- 意外性のある真相`
    },
    hard: {
        label: '上級',
        prompt: `【難易度：上級】
- 非常に不可解で複雑な状況
- 大きな発想の転換が必要
- 20回以上の質問が必要になることも
- 驚きの真相、哲学的・心理的な深み`
    }
};

// DOM Elements
const screens = {
    start: document.getElementById('start-screen'),
    game: document.getElementById('game-screen'),
    result: document.getElementById('result-screen')
};

const elements = {
    startBtn: document.getElementById('start-btn'),
    problemText: document.getElementById('problem-text'),
    questionInput: document.getElementById('question-input'),
    sendBtn: document.getElementById('send-btn'),
    questionCount: document.getElementById('question-count'),
    historyList: document.getElementById('history-list'),
    hintBtn: document.getElementById('hint-btn'),
    answerBtn: document.getElementById('answer-btn'),
    giveupBtn: document.getElementById('giveup-btn'),
    resultIcon: document.getElementById('result-icon'),
    resultTitle: document.getElementById('result-title'),
    answerText: document.getElementById('answer-text'),
    finalQuestionCount: document.getElementById('final-question-count'),
    yesCount: document.getElementById('yes-count'),
    noCount: document.getElementById('no-count'),
    nextBtn: document.getElementById('next-btn')
};

// Initialize background animation
function initBgAnimation() {
    const container = document.getElementById('bg-animation');
    if (!container) return;
    for (let i = 0; i < 15; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        const size = Math.random() * 100 + 50;
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${Math.random() * 100}%`;
        bubble.style.animationDuration = `${Math.random() * 20 + 15}s`;
        bubble.style.animationDelay = `${Math.random() * 10}s`;
        container.appendChild(bubble);
    }
}

// Show screen
function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen?.classList.remove('active'));
    screens[screenName]?.classList.add('active');
}

// Call OpenAI API
async function callOpenAI(prompt, systemPrompt = '') {
    if (!API_KEY) {
        throw new Error('API key is missing. Please set VITE_OPENAI_API_KEY in .env file');
    }

    try {
        const messages = [];
        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: messages,
                temperature: 0.8,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            console.error('OpenAI API Error:', errorBody);
            throw new Error(`API Error: ${response.status} - ${errorBody.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();

        if (!data.choices || data.choices.length === 0) {
            console.error('OpenAI Response error:', data);
            throw new Error('API returned no choices.');
        }

        return data.choices[0].message.content;
    } catch (error) {
        console.error('Fetch Error:', error);
        throw error;
    }
}

// Generate new problem
async function generateProblem() {
    if (gameState.isLoading) return;

    gameState.isLoading = true;
    elements.startBtn.disabled = true;
    const originalText = elements.startBtn.innerHTML;
    elements.startBtn.innerHTML = '<span class="loading">生成中<span class="loading-dots"><span></span><span></span><span></span></span></span>';

    try {
        const diffConfig = difficultyConfig[gameState.difficulty];
        const prompt = `あなたは「ウミガメのスープ」（水平思考クイズ）の出題者です。
以下の条件で新しい問題を1つ作成してください：

${diffConfig.prompt}

【共通条件】
- 一見不可解で興味を引く状況を提示
- 論理的に解決可能な謎
- 「はい」「いいえ」の質問で真相に辿り着ける
- 日本語で自然な文章
- ユニークで創造的な設定

以下のJSON形式で回答してください：
{
  "problem": "問題文（不可解な状況の描写）",
  "answer": "真相（なぜその状況が起きたのかの説明）"
}

JSONのみを出力してください。`;

        const response = await callOpenAI(prompt, 'あなたは創造的な水平思考クイズの作家です。');

        // Parse JSON response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('Failed to find JSON in response:', response);
            throw new Error('Invalid response format from AI');
        }

        const parsed = JSON.parse(jsonMatch[0]);
        gameState.problem = parsed.problem;
        gameState.answer = parsed.answer;
        gameState.questionCount = 0;
        gameState.yesCount = 0;
        gameState.noCount = 0;
        gameState.history = [];

        elements.problemText.textContent = gameState.problem;
        elements.questionCount.textContent = '0';
        elements.historyList.innerHTML = '';

        showScreen('game');
    } catch (error) {
        alert('問題の生成に失敗しました。\n理由: ' + error.message);
        console.error(error);
    } finally {
        gameState.isLoading = false;
        elements.startBtn.disabled = false;
        elements.startBtn.innerHTML = originalText;
    }
}

// Process question
async function processQuestion(question, isGuess = false) {
    if (gameState.isLoading || !question.trim()) return;

    gameState.isLoading = true;
    elements.sendBtn.disabled = true;
    elements.questionInput.disabled = true;

    try {
        const prompt = isGuess ?
            `あなたは「ウミガメのスープ」の出題者です。

【問題】
${gameState.problem}

【真相】
${gameState.answer}

【プレイヤーの推理】
${question}

プレイヤーの推理が真相と概ね一致しているか判定してください。
完全に同じでなくても、核心的な部分が合っていれば正解とします。

以下のJSON形式で回答：
{
  "isCorrect": true または false,
  "feedback": "正解の場合は祝福の言葉、不正解の場合は「もう少し質問を重ねてみましょう」という励まし"
}`
            :
            `あなたは「ウミガメのスープ」の出題者です。

【問題】
${gameState.problem}

【真相】
${gameState.answer}

【プレイヤーの質問】
${question}

この質問に対して、真相を踏まえて回答してください。

回答は必ず以下のいずれか：
- 「はい」- 質問の内容が真相において正しい場合
- 「いいえ」- 質問の内容が真相において正しくない場合  
- 「どちらとも言えません」- 真相と関係ない、または判断できない場合

以下のJSON形式で回答：
{
  "answer": "はい" または "いいえ" または "どちらとも言えません",
  "comment": "必要に応じて簡潔な補足（オプション）"
}`;

        const response = await callOpenAI(prompt, 'あなたは公正で論理的なクイズの出題者です。');

        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Invalid response format from AI');
        }

        const parsed = JSON.parse(jsonMatch[0]);

        if (isGuess) {
            if (parsed.isCorrect) {
                showResult(true);
            } else {
                addHistoryItem(question, '不正解', 'maybe');
                alert(parsed.feedback || 'もう少し質問を重ねてみましょう！');
            }
        } else {
            gameState.questionCount++;
            elements.questionCount.textContent = gameState.questionCount;

            let answerType = 'maybe';
            let displayAnswer = parsed.answer;

            if (parsed.answer.includes('はい')) {
                answerType = 'yes';
                gameState.yesCount++;
                displayAnswer = 'はい';
            } else if (parsed.answer.includes('いいえ')) {
                answerType = 'no';
                gameState.noCount++;
                displayAnswer = 'いいえ';
            } else {
                displayAnswer = 'どちらとも言えません';
            }

            addHistoryItem(question, displayAnswer, answerType);
        }

        elements.questionInput.value = '';
    } catch (error) {
        alert('回答の取得に失敗しました。\n理由: ' + error.message);
        console.error(error);
    } finally {
        gameState.isLoading = false;
        elements.sendBtn.disabled = false;
        elements.questionInput.disabled = false;
        elements.questionInput.focus();
    }
}

// Add history item
function addHistoryItem(question, answer, type) {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
        <div class="history-q">${escapeHtml(question)}</div>
        <div class="history-a ${type}">${answer}</div>
    `;
    elements.historyList.insertBefore(item, elements.historyList.firstChild);
    gameState.history.push({ question, answer, type });
}

// Get hint
async function getHint() {
    if (gameState.isLoading) return;

    gameState.isLoading = true;
    elements.hintBtn.disabled = true;
    const originalText = elements.hintBtn.innerHTML;
    elements.hintBtn.innerHTML = '💡 考え中...';

    try {
        const prompt = `あなたは「ウミガメのスープ」の出題者です。

【問題】
${gameState.problem}

【真相】
${gameState.answer}

プレイヤーにヒントを1つ与えてください。
- 直接答えを言わない
- 考える方向性を示唆する
- 1〜2文程度で簡潔に`;

        const response = await callOpenAI(prompt, 'あなたは親切なクイズの出題者です。');
        alert(`💡 ヒント: ${response}`);
    } catch (error) {
        alert('ヒントの取得に失敗しました。\n理由: ' + error.message);
        console.error(error);
    } finally {
        gameState.isLoading = false;
        elements.hintBtn.disabled = false;
        elements.hintBtn.innerHTML = originalText;
    }
}

// Show result
function showResult(isCorrect) {
    elements.resultIcon.textContent = isCorrect ? '🎉' : '🤔';
    elements.resultTitle.textContent = isCorrect ? '正解！おめでとう！' : '残念...ギブアップ';
    elements.resultTitle.className = `result-title ${isCorrect ? '' : 'giveup'}`;
    elements.answerText.textContent = gameState.answer;
    elements.finalQuestionCount.textContent = gameState.questionCount;
    elements.yesCount.textContent = gameState.yesCount;
    elements.noCount.textContent = gameState.noCount;
    showScreen('result');
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Event Listeners
// Difficulty selector
document.querySelectorAll('.difficulty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        gameState.difficulty = btn.dataset.difficulty;
    });
});

elements.startBtn?.addEventListener('click', generateProblem);

elements.sendBtn?.addEventListener('click', () => {
    processQuestion(elements.questionInput.value);
});

elements.questionInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        processQuestion(elements.questionInput.value);
    }
});

elements.hintBtn?.addEventListener('click', getHint);

elements.answerBtn?.addEventListener('click', () => {
    const guess = prompt('真相を推理してください：');
    if (guess && guess.trim()) {
        processQuestion(guess, true);
    }
});

elements.giveupBtn?.addEventListener('click', () => {
    if (confirm('ギブアップしますか？正解が表示されます。')) {
        showResult(false);
    }
});

elements.nextBtn?.addEventListener('click', () => {
    showScreen('start');
    generateProblem();
});

// Initialize
initBgAnimation();
