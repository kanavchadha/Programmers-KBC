const question = document.getElementById('question');
const quesimage = document.getElementById('quesimage');
const choices = Array.from(document.getElementsByClassName('choice-text'));
const lifelines = Array.from(document.getElementsByClassName('lifeline'));
const progressText = document.getElementById('progressText');
const scoreText = document.getElementById('score');
const quit = document.querySelector('.quit');

let currentQuestion = {};
let acceptingAnswers = false;

const scoresList = ["1K","2K","3K","5K","10K","20K","40K","80K","160K","320K","640K","1.25M","2.5M","50M","100M","700M"];
let score = 0;
let questionCounter = 0;
let availableQuesions = [];
let questions = [];

let LL5050=true;
let LLexpert=true;
let LLskip=true;
let LLfriend=true;


fetch('/get-questions',{
		method: 'GET'
	}).then((res) => {
        return res.json();
    }).then((loadedQuestions) => {
		console.log(loadedQuestions)
        questions = loadedQuestions.map(loadedQuestion => {
            const formattedQuestion = {
                question: loadedQuestion.question,
            };
			
			if(loadedQuestion.image!=""){
				formattedQuestion.image = loadedQuestion.image;
			}
			
            const answerChoices = [...loadedQuestion.options];
            formattedQuestion.answer = loadedQuestion.correctOption;

            answerChoices.forEach((choice, index) => {
                formattedQuestion['choice' + (index + 1)] = choice;
            });

            return formattedQuestion;
        });
        startGame();
    })
    .catch((err) => {
        console.error(err);
    });

const CORRECT_BONUS = 10;
const MAX_QUESTIONS = 16;

const startGame = () => {
    questionCounter = 0;
    score = 0;
    availableQuesions = [...questions];
    getNewQuestion();
};

const getNewQuestion = () => {
    if (availableQuesions.length === 0 || questionCounter >= MAX_QUESTIONS) {
        localStorage.setItem('mostRecentScore', score);
		setTimeout(()=>{
        	return window.location.assign('/end-game');
		},2000);
    }
    questionCounter++;
	if(questionCounter > 15){
		LL5050 = false;
		LLexpert = false;
		LLskip = false;
		LLfriend = false;
	}

    progressText.innerText = `${questionCounter}/${MAX_QUESTIONS}`;
   
    currentQuestion = availableQuesions[0];
    question.innerText = currentQuestion.question;
	
	if(quesimage.childNodes.length > 0){
		quesimage.removeChild(quesimage.childNodes[0]);
	}
	if(currentQuestion.image){
		const img = document.createElement('img');
		img.setAttribute('src', currentQuestion.image);
		quesimage.appendChild(img);
	}
	
    choices.forEach((choice) => {
        const number = choice.dataset['number'];
		choice.style.backgroundColor = "transparent";
        choice.innerText = currentQuestion['choice' + number];
    });
	
	let timer = 45000;
	if(questionCounter>14){
		timer = 90000;
	}else if(questionCounter>6){
		timer = 60000;
	}
	
	setTimer(timer);
	
	acceptingAnswers = true;
    availableQuesions.shift();
   
};

choices.forEach((choice) => {
    choice.addEventListener('click', (e) => {
        if (!acceptingAnswers) return;
        acceptingAnswers = false;
        const selectedChoice = e.target;
        const selectedAnswer = selectedChoice.dataset['number'];
		const currLevel = document.querySelectorAll('ol > li')[16-questionCounter];
        currLevel.style.textShadow = '0 3px 4px rgba(0,0,0,0.5)';
		currLevel.style.fontWeight = 'bold';
		
		const classToApply =
            selectedAnswer == currentQuestion.answer ? 'correct' : 'incorrect';
        if (classToApply === 'correct') {
            incrementScore();
			currLevel.style.color = '#6dfcca';
        } else{
			currLevel.style.color = '#ed2f49';
			if(questionCounter<=5){
				score = '0';
			}else if(questionCounter<=12){
				score = scoresList[4];
			}else{
				score = scoresList[11];
			}
			quit.click();
		}

        selectedChoice.parentElement.classList.add(classToApply);

        setTimeout(() => {
            selectedChoice.parentElement.classList.remove(classToApply);
            getNewQuestion();
        }, 1000);
    });
});

const incrementScore = () => {
    score = scoresList[questionCounter-1];
	if(questionCounter<15){
		document.getElementById('corrAns').play();
	}else if(questionCounter==15){
		document.getElementById('1croreaudio').play();
	}else if(questionCounter==16){
		document.getElementById('7croreaudio').play();
	}
    scoreText.innerText = `${score}`;
};

let timerId,intervalID,rmt=0;

const setTimer = (ms)=>{
	clearInterval(intervalID);
	let duration = new Date().getTime()+ms;
	intervalID = setInterval(()=>{
		var d = duration -  new Date().getTime();
		var minutes = Math.floor((d % (1000 * 60 * 60)) / (1000 * 60));
  		var seconds = Math.floor((d % (1000 * 60)) / 1000);
		document.querySelector('.timer').innerText = minutes.toString()+':'+seconds.toString();
		rmt = minutes*60 + seconds;
		if (d < 0) {
			rmt=0;
			clearInterval(intervalID);
			document.querySelector('.timer').innerText = "EXPIRED";
			
			if(questionCounter<=5){
				score = '0';
			}else if(questionCounter<=12){
				score = scoresList[4];
			}else{
				score = scoresList[11];
			}
			
			quit.click();
		}
	},1000)
}

const pauseTimer = (rmt)=>{
	clearInterval(intervalID);
	timerId = setTimeout(()=>{
		clearTimeout(timerId);
		setTimer(rmt*1000);
	},120000);
}
const pauseTimer1 = (rmt)=>{
	clearInterval(intervalID);
	timerId = setTimeout(()=>{
		clearTimeout(timerId);
		setTimer(rmt*1000);
	},8000);
}

lifelines.forEach(ll=>{
	ll.addEventListener('click',(e)=>{
		const choosedLL = e.target.dataset.ll;
		e.target.disabled = true;
		handleLifelines(choosedLL);
	});
});

const handleLifelines = (LL)=>{
	switch(LL){
		case 'friend':
			if(LLfriend){
				LLfriend=false;
				document.getElementById('lifphone').play();
				const data={
					question: currentQuestion.question,
					mobileNum: localStorage.getItem('FriendNo'),
					choices: 'a) '+currentQuestion.choice1 + ' b) '+ currentQuestion.choice2+' c) '+currentQuestion.choice3+' d) '+currentQuestion.choice4
				}
				if(currentQuestion.image){
					data.image = currentQuestion.image;
				}
				fetch('/sendMessage',{
					method: 'POST',
					headers: { 'Content-Type': 'application/json'},
					body: JSON.stringify(data),
				}).then(res=>{
					const popupModal = document.querySelector('[data-popup-modal="three"]');
					const bodyBlackout = document.querySelector('.body-blackout');
					const p = document.createElement('p');
					p.innerText = `We are Pausing your timer for "Two-Minutes", You can Call your Friend and We SMS this question to your Friend's PhoneNumber`;
					p.style.color="forestgreen";
					p.style.fontWeight="bold";
					p.style.fontSize="1.5rem";
					p.style.wordBreak="break-word";
					popupModal.appendChild(p);
					popupModal.classList.add('is--visible')
					bodyBlackout.classList.add('is-blacked-out')
					bodyBlackout.addEventListener('click', () => {
					  popupModal.classList.remove('is--visible')
					  bodyBlackout.classList.remove('is-blacked-out')
					})
					pauseTimer(rmt);
				}).catch(err=>{
					console.log(err.message);
				})
			}
			break;
		case 'expert':
			if(LLexpert){
				document.getElementById('lifexpert').play();
				LLexpert = false;
				const popupModal = document.querySelector('[data-popup-modal="two"]');
				const bodyBlackout = document.querySelector('.body-blackout');
				const p = document.createElement('p');
				p.innerText =
					document.querySelector(`[data-number="${currentQuestion.answer}"]`).innerText;
				p.style.color="forestgreen";
				p.style.textAlign="center";
				p.style.fontWeight="bold";
				p.style.fontSize="2rem";
				popupModal.appendChild(p);
				
				popupModal.classList.add('is--visible')
				bodyBlackout.classList.add('is-blacked-out')
				bodyBlackout.addEventListener('click', () => {
				  popupModal.classList.remove('is--visible')
				  bodyBlackout.classList.remove('is-blacked-out')
				})
				pauseTimer1(rmt);
			}
			break;
		case 'skip':
			if(LLskip){
				LLskip=false;
				document.getElementById('lifflip').play();
				 getNewQuestion();
			}
			break;
		case '5050':
			if(LL5050){
				let cnt=0;
				LL5050=false;
				document.getElementById('lif5050').play();
				for(let ch of choices){
					if(currentQuestion.answer != ch.dataset.number){
						ch.style.backgroundColor = 'red';
						cnt++;
					}
					if(cnt>=2) return;
				}
			}
			break;

	}
}


quit.addEventListener('click',()=>{
    localStorage.setItem('mostRecentScore', score);
	score = 0;
	questionCounter = 0;
	availableQuesions = [];
	availableQuesions = [...questions];
	clearInterval(intervalID);	
    return window.location.assign('/end-game');
})