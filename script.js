// Game State
class WordPuzzleGame {
    constructor() {
        this.words = {
            animals: [
                { word: 'ELEPHANT', hint: 'Large mammal with trunk' },
                { word: 'GIRAFFE', hint: 'Tallest land animal' },
                { word: 'PENGUIN', hint: 'Flightless bird that swims' },
                { word: 'DOLPHIN', hint: 'Intelligent marine mammal' },
                { word: 'BUTTERFLY', hint: 'Colorful flying insect' }
            ],
            technology: [
                { word: 'COMPUTER', hint: 'Electronic calculating device' },
                { word: 'INTERNET', hint: 'Global network' },
                { word: 'SOFTWARE', hint: 'Computer programs' },
                { word: 'KEYBOARD', hint: 'Input device with keys' },
                { word: 'MONITOR', hint: 'Display screen' }
            ],
            nature: [
                { word: 'MOUNTAIN', hint: 'Large natural elevation' },
                { word: 'OCEAN', hint: 'Large body of water' },
                { word: 'FOREST', hint: 'Dense collection of trees' },
                { word: 'DESERT', hint: 'Dry, sandy region' },
                { word: 'RAINBOW', hint: 'Colorful arc in the sky' }
            ]
        };
        
        this.currentCategory = 'animals';
        this.currentWordIndex = 0;
        this.currentWord = null;
        this.scrambledLetters = [];
        this.inputSlots = [];
        this.score = 0;
        this.level = 1;
        this.timeLeft = 120; // 2 minutes
        this.timerInterval = null;
        this.isGameActive = false;
        this.hintsUsed = 0;
        this.wordsSolved = 0;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.startGame();
        this.initAnimations();
    }
    
    setupEventListeners() {
        // Button listeners
        document.getElementById('submit-btn').addEventListener('click', () => this.submitWord());
        document.getElementById('shuffle-btn').addEventListener('click', () => this.shuffleLetters());
        document.getElementById('hint-btn').addEventListener('click', () => this.showHint());
        document.getElementById('skip-btn').addEventListener('click', () => this.skipWord());
        document.getElementById('next-word-btn').addEventListener('click', () => this.nextWord());
        document.getElementById('play-again-btn').addEventListener('click', () => this.resetGame());
        document.getElementById('share-btn').addEventListener('click', () => this.shareScore());
        
        // Modal close on background click
        document.getElementById('success-modal').addEventListener('click', (e) => {
            if (e.target.id === 'success-modal') {
                this.closeModal('success-modal');
            }
        });
        
        document.getElementById('game-over-modal').addEventListener('click', (e) => {
            if (e.target.id === 'game-over-modal') {
                this.closeModal('game-over-modal');
            }
        });
        
        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.submitWord();
            } else if (e.key === 'Escape') {
                this.clearInput();
            }
        });
    }
    
    startGame() {
        this.isGameActive = true;
        this.score = 0;
        this.level = 1;
        this.timeLeft = 120;
        this.wordsSolved = 0;
        this.hintsUsed = 0;
        this.currentWordIndex = 0;
        
        this.updateStats();
        this.startTimer();
        this.loadNewWord();
        this.hideLoadingScreen();
    }
    
    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateTimer();
            
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }
    
    updateTimer() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        document.getElementById('timer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Add urgency effect when time is low
        if (this.timeLeft <= 10) {
            document.getElementById('timer').classList.add('urgent');
        } else {
            document.getElementById('timer').classList.remove('urgent');
        }
    }
    
    loadNewWord() {
        const categories = Object.keys(this.words);
        this.currentCategory = categories[Math.floor(Math.random() * categories.length)];
        const categoryWords = this.words[this.currentCategory];
        
        if (this.currentWordIndex >= categoryWords.length) {
            this.currentWordIndex = 0;
            this.level++;
            this.updateStats();
        }
        
        this.currentWord = categoryWords[this.currentWordIndex];
        this.scrambledLetters = this.scrambleWord(this.currentWord.word);
        this.inputSlots = new Array(this.currentWord.word.length).fill('');
        
        this.updateUI();
        this.animateWordEntry();
    }
    
    scrambleWord(word) {
        const letters = word.split('');
        for (let i = letters.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [letters[i], letters[j]] = [letters[j], letters[i]];
        }
        return letters;
    }
    
    updateUI() {
        // Update category and hint
        document.getElementById('category').textContent = this.currentCategory.charAt(0).toUpperCase() + this.currentCategory.slice(1);
        document.getElementById('hint-description').textContent = this.currentWord.hint;
        
        // Update scrambled word display
        const scrambledWordEl = document.getElementById('scrambled-word');
        scrambledWordEl.innerHTML = '';
        
        this.scrambledLetters.forEach((letter, index) => {
            const letterTile = document.createElement('div');
            letterTile.className = 'letter-tile';
            letterTile.textContent = letter;
            letterTile.dataset.index = index;
            letterTile.addEventListener('click', () => this.selectLetter(index));
            scrambledWordEl.appendChild(letterTile);
        });
        
        // Update input slots
        const inputSlotsEl = document.getElementById('input-slots');
        inputSlotsEl.innerHTML = '';
        
        this.inputSlots.forEach((slot, index) => {
            const slotEl = document.createElement('div');
            slotEl.className = 'input-slot';
            slotEl.dataset.position = index;
            if (slot) {
                slotEl.textContent = slot;
                slotEl.classList.add('filled');
            }
            inputSlotsEl.appendChild(slotEl);
        });
        
        // Update letter bank
        this.updateLetterBank();
        
        // Update progress
        const totalWords = Object.values(this.words).flat().length;
        document.getElementById('current-word').textContent = this.wordsSolved + 1;
        document.getElementById('total-words').textContent = totalWords;
        document.getElementById('progress-fill').style.width = `${(this.wordsSolved / totalWords) * 100}%`;
    }
    
    updateLetterBank() {
        const letterBankEl = document.getElementById('letter-bank');
        letterBankEl.innerHTML = '';
        
        const usedLetters = this.inputSlots.filter(slot => slot !== '');
        const availableLetters = this.scrambledLetters.filter(letter => 
            !usedLetters.includes(letter) || 
            this.scrambledLetters.filter(l => l === letter).length > 
            usedLetters.filter(l => l === letter).length
        );
        
        availableLetters.forEach((letter, index) => {
            const bankLetter = document.createElement('div');
            bankLetter.className = 'bank-letter';
            bankLetter.textContent = letter;
            bankLetter.dataset.letter = letter;
            bankLetter.addEventListener('click', () => this.addLetterToInput(letter));
            letterBankEl.appendChild(bankLetter);
        });
    }
    
    selectLetter(index) {
        const letter = this.scrambledLetters[index];
        this.addLetterToInput(letter);
        
        // Animate selection
        const tile = document.querySelector(`.letter-tile[data-index="${index}"]`);
        tile.classList.add('selected');
        setTimeout(() => tile.classList.remove('selected'), 300);
    }
    
    addLetterToInput(letter) {
        const emptySlot = this.inputSlots.findIndex(slot => slot === '');
        if (emptySlot !== -1) {
            this.inputSlots[emptySlot] = letter;
            this.updateUI();
            this.animateSlotFill(emptySlot);
        }
    }
    
    clearInput() {
        this.inputSlots = new Array(this.currentWord.word.length).fill('');
        this.updateUI();
    }
    
    submitWord() {
        const userWord = this.inputSlots.join('');
        
        if (userWord === this.currentWord.word) {
            this.handleCorrectWord();
        } else {
            this.handleIncorrectWord();
        }
    }
    
    handleCorrectWord() {
        this.score += 100;
        this.wordsSolved++;
        this.updateStats();
        
        // Animate success
        this.animateSuccess();
        
        // Show success modal
        setTimeout(() => {
            document.getElementById('correct-word').textContent = this.currentWord.word;
            document.getElementById('points-earned').textContent = '+100';
            this.openModal('success-modal');
        }, 1000);
    }
    
    handleIncorrectWord() {
        // Animate incorrect
        this.animateIncorrect();
        
        // Clear input after animation
        setTimeout(() => {
            this.clearInput();
        }, 500);
    }
    
    shuffleLetters() {
        this.scrambledLetters = this.scrambleWord(this.currentWord.word);
        this.updateUI();
        this.animateShuffle();
    }
    
    showHint() {
        if (this.hintsUsed < 3) {
            this.hintsUsed++;
            
            // Find first empty slot or random incorrect slot
            let hintIndex = this.inputSlots.findIndex(slot => slot === '');
            if (hintIndex === -1) {
                // All slots filled, find a random incorrect one
                hintIndex = Math.floor(Math.random() * this.inputSlots.length);
            }
            
            this.inputSlots[hintIndex] = this.currentWord.word[hintIndex];
            this.updateUI();
            
            // Highlight hint slot
            const slot = document.querySelector(`.input-slot[data-position="${hintIndex}"]`);
            slot.classList.add('hint');
            setTimeout(() => slot.classList.remove('hint'), 2000);
            
            // Deduct points for using hint
            this.score = Math.max(0, this.score - 25);
            this.updateStats();
        }
    }
    
    skipWord() {
        this.score = Math.max(0, this.score - 50);
        this.updateStats();
        this.nextWord();
    }
    
    nextWord() {
        this.closeModal('success-modal');
        this.currentWordIndex++;
        this.clearInput();
        this.loadNewWord();
    }
    
    endGame() {
        this.isGameActive = false;
        clearInterval(this.timerInterval);
        
        // Calculate final stats
        const timeBonus = Math.max(0, this.timeLeft * 2);
        const finalScore = this.score + timeBonus;
        
        // Update game over modal
        document.getElementById('final-score').textContent = finalScore;
        document.getElementById('words-solved').textContent = this.wordsSolved;
        document.getElementById('time-bonus').textContent = `+${timeBonus}`;
        
        // Update stars
        const stars = this.calculateStars(finalScore);
        const starsContainer = document.getElementById('rating-stars');
        starsContainer.innerHTML = '';
        for (let i = 0; i < 5; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.textContent = '⭐';
            if (i < stars) {
                star.classList.add('filled');
            }
            starsContainer.appendChild(star);
        }
        
        this.openModal('game-over-modal');
    }
    
    calculateStars(score) {
        if (score >= 1000) return 5;
        if (score >= 800) return 4;
        if (score >= 600) return 3;
        if (score >= 400) return 2;
        if (score >= 200) return 1;
        return 0;
    }
    
    resetGame() {
        this.closeModal('game-over-modal');
        this.startGame();
    }
    
    shareScore() {
        const text = `I scored ${this.score} points in Word Flow! Can you beat my score?`;
        if (navigator.share) {
            navigator.share({
                title: 'Word Flow Score',
                text: text
            });
        } else {
            // Fallback - copy to clipboard
            navigator.clipboard.writeText(text);
            alert('Score copied to clipboard!');
        }
    }
    
    updateStats() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
    }
    
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.classList.add('hidden');
    }
    
    // Anime.js Animations
    initAnimations() {
        // Initial load animation
        anime({
            targets: '.game-header',
            translateY: [-50, 0],
            opacity: [0, 1],
            duration: 1000,
            easing: 'easeOutExpo'
        });
        
        anime({
            targets: '.game-main > *',
            translateY: [30, 0],
            opacity: [0, 1],
            delay: anime.stagger(200),
            duration: 800,
            easing: 'easeOutQuad'
        });
        
        // Floating background letters
        anime({
            targets: '.floating-letter',
            translateY: [-20, 20],
            translateX: [-10, 10],
            rotate: [-5, 5],
            duration: 4000,
            direction: 'alternate',
            loop: true,
            delay: anime.stagger(1000),
            easing: 'easeInOutSine'
        });
        
        // Particle animation
        anime({
            targets: '.particle',
            translateX: () => anime.random(-50, 50),
            translateY: () => anime.random(-50, 50),
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.6, 0.3],
            duration: 3000,
            direction: 'alternate',
            loop: true,
            delay: anime.stagger(500),
            easing: 'easeInOutQuad'
        });
    }
    
    animateWordEntry() {
        anime({
            targets: '.letter-tile',
            scale: [0, 1],
            rotate: [180, 0],
            opacity: [0, 1],
            delay: anime.stagger(100),
            duration: 600,
            easing: 'easeOutBack'
        });
    }
    
    animateSlotFill(index) {
        anime({
            targets: `.input-slot[data-position="${index}"]`,
            scale: [1, 1.2, 1],
            backgroundColor: ['rgba(102, 126, 234, 0.1)', 'rgba(102, 126, 234, 0.3)', 'rgba(102, 126, 234, 0.1)'],
            duration: 300,
            easing: 'easeInOutQuad'
        });
    }
    
    animateSuccess() {
        // Green flash effect
        anime({
            targets: '.input-slot',
            backgroundColor: ['rgba(74, 222, 128, 0.3)', 'rgba(74, 222, 128, 0.6)', 'rgba(74, 222, 128, 0.3)'],
            scale: [1, 1.1, 1],
            duration: 600,
            easing: 'easeInOutQuad'
        });
        
        // Confetti effect
        this.createConfetti();
    }
    
    animateIncorrect() {
        anime({
            targets: '.input-slot',
            translateX: [-10, 10, -10, 10, 0],
            backgroundColor: ['rgba(248, 113, 113, 0.3)', 'rgba(248, 113, 113, 0.6)', 'rgba(248, 113, 113, 0.3)'],
            duration: 500,
            easing: 'easeInOutQuad'
        });
    }
    
    animateShuffle() {
        anime({
            targets: '.letter-tile',
            scale: [1, 0.8, 1],
            rotate: [0, 360],
            opacity: [1, 0.5, 1],
            delay: anime.stagger(50),
            duration: 600,
            easing: 'easeInOutBack'
        });
    }
    
    createConfetti() {
        const colors = ['#667eea', '#764ba2', '#f093fb', '#4ade80', '#fbbf24'];
        const confettiCount = 50;
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.width = '10px';
            confetti.style.height = '10px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.top = '-10px';
            confetti.style.borderRadius = '50%';
            confetti.style.zIndex = '9999';
            confetti.style.pointerEvents = 'none';
            document.body.appendChild(confetti);
            
            anime({
                targets: confetti,
                translateY: window.innerHeight + 20,
                translateX: () => anime.random(-200, 200),
                rotate: () => anime.random(0, 360),
                opacity: [1, 0],
                duration: 2000,
                easing: 'easeOutQuad',
                complete: () => confetti.remove()
            });
        }
    }
}

// Motion.dev animations
class MotionAnimations {
    constructor() {
        this.initMotionEffects();
    }
    
    initMotionEffects() {
        // Button hover effects with Motion.dev
        if (window.motion) {
            // Animate buttons on hover
            document.querySelectorAll('.btn').forEach(btn => {
                btn.addEventListener('mouseenter', () => {
                    motion.animate(btn, {
                        scale: 1.05,
                        transition: { duration: 0.2 }
                    });
                });
                
                btn.addEventListener('mouseleave', () => {
                    motion.animate(btn, {
                        scale: 1,
                        transition: { duration: 0.2 }
                    });
                });
            });
            
            // Letter tile interactions
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('letter-tile')) {
                    motion.animate(e.target, {
                        scale: [1, 0.9, 1],
                        rotate: [0, -5, 5, 0],
                        transition: { duration: 0.3 }
                    });
                }
            });
            
            // Progress bar animation
            this.animateProgress();
        }
    }
    
    animateProgress() {
        const progressFill = document.getElementById('progress-fill');
        if (progressFill && window.motion) {
            motion.animate(progressFill, {
                width: progressFill.style.width,
                transition: { duration: 0.5, easing: 'ease-out' }
            });
        }
    }
    
    // Modal animations with Motion.dev
    animateModalOpen(modal) {
        if (window.motion) {
            motion.animate(modal.querySelector('.modal-content'), {
                scale: [0.8, 1],
                opacity: [0, 1],
                transition: { duration: 0.3, easing: 'ease-out' }
            });
        }
    }
    
    animateModalClose(modal) {
        if (window.motion) {
            motion.animate(modal.querySelector('.modal-content'), {
                scale: [1, 0.8],
                opacity: [1, 0],
                transition: { duration: 0.2, easing: 'ease-in' }
            });
        }
    }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new WordPuzzleGame();
    const motionAnimations = new MotionAnimations();
    
    // Make game instance globally available for debugging
    window.wordPuzzleGame = game;
});

// Handle visibility change (pause game when tab is not visible)
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.wordPuzzleGame) {
        // Pause timer when tab is not visible
        if (window.wordPuzzleGame.timerInterval) {
            clearInterval(window.wordPuzzleGame.timerInterval);
            window.wordPuzzleGame.wasPaused = true;
        }
    } else if (window.wordPuzzleGame && window.wordPuzzleGame.wasPaused) {
        // Resume timer when tab becomes visible
        window.wordPuzzleGame.startTimer();
        window.wordPuzzleGame.wasPaused = false;
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    // Adjust game layout if needed
    if (window.wordPuzzleGame) {
        // Recalculate positions or adjust UI
        window.wordPuzzleGame.updateUI();
    }
});
