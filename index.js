        const canvas = document.getElementById("game");
        const ctx = canvas.getContext("2d");
        let lives = 3;
        let score = 0;
        let pointsPerLife = 500;  
        const FPS = 30;  
        const rotationSpeed = (110 / 180) * Math.PI / FPS; //formula in radiani pe cadru;calculeaza viteza de rotatie a navei 
        let levelInProgress = false; 
        let highScores = JSON.parse(localStorage.getItem('highScores')) || [];//incarca scorurile maxime salvate anterior

            class Asteroid {
                constructor(x, y, size, value, speedX, speedY) {
                    this.x = x;
                    this.y = y;
                    this.size = value * 10 + 10;
                    this.value = value;
                    this.speedX = speedX;
                    this.speedY = speedY;
                    this.color = this.getColorByValue(value);
                }
            
                getColorByValue(value) {  //culoare bazata pe valoare
                    switch (value) {
                        case 1: return "blue";
                        case 2: return "purple";
                        case 3: return "orange";
                        case 4: return "red";
                    }
                }
            
                draw() {
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fillStyle = this.color;
                    ctx.fill();
                    ctx.closePath();
            
                    // desenarea valoare asteroid
                    ctx.fillStyle = "white";
                    ctx.font = "bold 20px Courier";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(this.value, this.x, this.y);
                }
            
                update() {
                    this.x += this.speedX;
                    this.y += this.speedY;
            
                    // adauga viteza la pozitia curenta
                    if (this.x < 0) this.x = canvas.width;
                    if (this.x > canvas.width) this.x = 0;
                    if (this.y < 0) this.y = canvas.height;
                    if (this.y > canvas.height) this.y = 0;
                }
            
                checkCollisionWithAsteroid(otherAsteroid) {     
                    const dist = Math.hypot(this.x - otherAsteroid.x, this.y - otherAsteroid.y);  //calculeaza distanta intre doi astero si verifica daca se suprapun
                    if (dist < this.size + otherAsteroid.size) {
                       
                        const tempSpeedX = this.speedX;
                        const tempSpeedY = this.speedY;
            
                        this.speedX = otherAsteroid.speedX;
                        this.speedY = otherAsteroid.speedY;
            
                        otherAsteroid.speedX = tempSpeedX;
                        otherAsteroid.speedY = tempSpeedY;
                    }
                }
            }
            class Spaceship {
                constructor(x, y, r, angle) {
                    this.x = x;
                    this.y = y;
                    this.r = r;
                    this.a = angle; 
                    this.rot = 0; 
                    this.thrusting = false;
                    this.thrust = { x: 0, y: 0 };
                    this.friction = 0.5; //simulam reducerea de viteza 
                    this.thrustPower = 3.5; 
                    this.sideThrustPower = 3.5;
                    this.thrustingDown = false;
                    this.movingLeft = false;
                    this.movingRight =false;
                    this.hidden = false;  //adaugare nedesenare 
                    this.particlesAlive = false;  //reprezinta particulele asociate cu explozia navei in cazul unei coliziuni
                }
            
                draw() {
                    
                    if(this.hidden) return ;  //nu desenam nava daca este ascunsa
            
                    ctx.save();
                    ctx.strokeStyle = "white";
                    ctx.lineWidth = this.r / 10;
                    ctx.beginPath();
                    ctx.moveTo(
                        this.x + (5 / 3) * this.r * Math.cos(this.a),
                        this.y - (5 / 3) * this.r * Math.sin(this.a)
                    );
                    ctx.lineTo(
                        this.x - this.r * (1 / 2 * Math.cos(this.a) + Math.sin(this.a)),
                        this.y + this.r * (1 / 2 * Math.sin(this.a) - Math.cos(this.a))
                    );
                    ctx.lineTo(
                        this.x - this.r * (1 / 2 * Math.cos(this.a) - Math.sin(this.a)),
                        this.y + this.r * (1 / 2 * Math.sin(this.a) + Math.cos(this.a))
                    );
                    ctx.closePath();
                    ctx.stroke();
            
                    //efect de propulsie desenare ; exact ca la nava
                    if (this.thrusting) {
                        ctx.fillStyle = "white";
                        ctx.beginPath();
                        ctx.moveTo(
                            this.x - this.r * (1 / 2 * Math.cos(this.a) + 0.3 * Math.sin(this.a)),
                            this.y + this.r * (1 / 2 * Math.sin(this.a) - 0.3 * Math.cos(this.a))
                        );
                        ctx.lineTo(
                            this.x - this.r * (2.5) * Math.cos(this.a),
                            this.y + this.r * (2.5) * Math.sin(this.a)
                        );
                        ctx.lineTo(
                            this.x - this.r * (1/ 2 * Math.cos(this.a) - 0.3* Math.sin(this.a)),
                            this.y + this.r * (1 / 2 * Math.sin(this.a) + 0.3 * Math.cos(this.a))
                        );
                        ctx.closePath();
                        ctx.fill();
                    }
                    
                    
                }
            
                update() {
                    
                    if(this.hidden) return; // nu actualizam pozitia navei daca este ascunsa
            
                    //deplasare in sus
                    if (this.thrusting) {
                        this.thrust.x += (this.thrustPower * Math.cos(this.a)) / FPS;
                        this.thrust.y -= (this.thrustPower * Math.sin(this.a)) / FPS;
                    }
            
                    //deplasare in jos
                    if (this.thrustingDown) {
                        this.thrust.x -= (this.thrustPower * Math.cos(this.a)) / FPS;
                        this.thrust.y += (this.thrustPower * Math.sin(this.a)) / FPS;
                    }
            
            
                    //deplasare laterala
                    if(this.movingLeft){
                        this.thrust.x -= this.sideThrustPower / FPS;
                    }
            
                    if(this.movingRight){
                        this.thrust.x += this.sideThrustPower / FPS;
                    }
            
                            //aplicarea frictiunii
                    this.thrust.x -= (this.friction * this.thrust.x) / FPS;
                    this.thrust.y -= (this.friction * this.thrust.y) / FPS;
            
                            //actualizare pozitie
                    this.x += this.thrust.x;
                    this.y += this.thrust.y;
                    
                    this.a += this.rot;  //actualizarea rotatiei
            
                    //marigini ecran
                    if (this.x < 0 - this.r) this.x = canvas.width + this.r;
                    if (this.x > canvas.width + this.r) this.x = 0 - this.r;
                    if (this.y < 0 - this.r) this.y = canvas.height + this.r;
                    if (this.y > canvas.height + this.r) this.y = 0 - this.r;
                }
            
                shoot() {
                    if(this.hidden) return;   // nu putem sa tragem atunci cand suntem in perioada de invizibilitate pana cand nu aparem in joc
                    if (bullets.length < 3) { // limitare la 3 gloante/rachete
                        const bulletSpeed = 5;
                        const bulletX = this.x + Math.cos(this.a) * (4 / 3) * this.r; // Vârf triunghi
                        const bulletY = this.y - Math.sin(this.a) * (4 / 3) * this.r; // Vârf triunghi
                        const bullet = new Bullet(bulletX, bulletY, this.a, bulletSpeed);
                        bullets.push(bullet);
                    }
                }
                checkCollisionWithAsteroid(asteroid) {
                    const dist = Math.hypot(this.x - asteroid.x, this.y - asteroid.y);
                    return dist < this.r + asteroid.size;
                }
            }
            class Particle {
            
                constructor(x, y, color, speedX, speedY, life) {
                this.x = x;
                this.y = y;
                this.color = color;
                this.speedX = speedX;
                this.speedY = speedY;
                this.life = life; // durata de viață a particulei
                }
            
                draw() {
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, 3, 0, Math.PI * 2); // dimensiunea particulelor
                    ctx.fillStyle = this.color;
                    ctx.fill();
                    ctx.closePath();
                }
            
                update() {
                    this.x += this.speedX;
                    this.y += this.speedY;
                    this.life -= 1; // scădem durata de viață a particulei
                    }       
            
                    isAlive() {
                    return this.life > 0; //verificam daca particula este inca activa
                }
            }

           
        let spaceship = new Spaceship(canvas.width / 2, canvas.height / 2, 15, (90 / 180) * Math.PI);
            const keysPressed = {};  //initializam un obiect gol care stocheaza informatii despre tastele apasate


            class Bullet {
                constructor(x, y, angle, speed) {
                    this.x = x;
                    this.y = y;
                    this.angle = angle;
                    this.speed = speed;
                    this.size = 5;
                    this.active = true;
                }
            
                draw() {
                    if (this.active) {
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                        ctx.fillStyle = "white";
                        ctx.fill();
                        ctx.closePath();
                    }
                }
            
                update() {
                    if (this.active) {
                        this.x += Math.cos(this.angle) * this.speed;
                        this.y -= Math.sin(this.angle) * this.speed;
            
                        // Remove bullet if it goes off screen
                        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
                            this.active = false;
                        }
                    }
                }
            
                checkCollision(asteroid) {
                    const dist = Math.hypot(this.x - asteroid.x, this.y - asteroid.y);
                    if (dist < asteroid.size && this.active) {
                        this.active = false;  
                        const originValue = asteroid.value; // salvam valoarea originiala altfel case 1 nu merge 
                        asteroid.value -= 1;   
                        const originalColor = asteroid.color; //pastram culoarea originala a asteroidului
                        if (asteroid.value > 0 ) {
                            
                            asteroid.size  = asteroid.value * 10 + 10;  //recalcularea dimensiunii asteroidului
                            asteroid.color = asteroid.getColorByValue(asteroid.value);
                        }
                    
                        
                        for (let i = 0; i < 15; i++) {
                                    const angle = Math.random() * Math.PI * 2; 
                                    const speed = Math.random() * 2 ; 
                                    const particle = new Particle(asteroid.x,asteroid.y,originalColor,Math.cos(angle)*speed,Math.sin(angle)*speed,85); // durata de viață a particulelor
                            particles.push(particle); // adaugare particule in lista globala
                                }
                            // eliminam asteroidul cand ajunge la valoarea 0 
                            if(asteroid.value <= 0 ){
                                const i = asteroids.indexOf(asteroid);
                                if (i > -1) asteroids.splice(i, 1);
                            }
                            //puncte in functie de valoarea asteroidului
                            switch(originValue){
                            case 1:
                                    score += 100;
                                break;
                            case 2:
                                    score += 50;
                                break;
                            case 3:
                                score += 50;
                                break;
                            case 4:
                                    score += 50;
                                break;
                        }
                    
                        // verificare pentru regenerarea vietii
                        if (score >= pointsPerLife) {
                            lives++; 
                            pointsPerLife += 500;   //incrementare punctaj pentru viata urmatoare
                        }
                        if (lives >= 3) lives = 3; //maxim 3 vieti
            
                    
                }
            
            }
        }
        function createAsteroids(c) {
            let tries = 0; // 
            for (let i = 0; i < c; i++) {
                let goodPosition = false;
                let x, y, size, value;
                while (!goodPosition && tries < 100) { // in caz de inf loops
                    value = Math.floor(Math.random() * 4) +1; 
                    x = Math.random() * canvas.width;
                    y = Math.random() * canvas.height;

                    // calculam distanta pana la nava
                    const distToSpaceship = Math.hypot(x - spaceship.x, y - spaceship.y);

                    // verificam daca pozitia este ok; daca este prea aproape de nava
                    if (distToSpaceship > spaceship.r * 10) { // ajustarea multiplicatorului de distantiere
                        goodPosition = true;
                        for (const asteroid of asteroids) {
                            const distToOtherAsteroid = Math.hypot(x - asteroid.x, y - asteroid.y);
                            if (distToOtherAsteroid < value*10 + 10) {
                                goodPosition = false;
                                break;
                            }
                        }
                    }
                    tries++;
                }

                if (goodPosition) {
                    const speedX = (Math.random() - 0.5) * 2; // viteza aleatoare pe x a asteroidului
                    const speedY = (Math.random() - 0.5) * 2; // viteza aleatoare pe y a asteroidului
                    asteroids.push(new Asteroid(x, y, size, value, speedX, speedY));
                }
            }
        }
        function resetGame() {
            asteroids.length = 0; 
            bullets.length = 0; 

            //refacem nava in canvas
            spaceship.x = canvas.width / 2;
            spaceship.y = canvas.height / 2;
            spaceship.thrust = { x: 0, y: 0 };
            spaceship.a = (90 / 180) * Math.PI; 
            spaceship.thrusting = false; 
            spaceship.rot = 0; // oprim rotatia
            lives = 3; 
            score = 0; 
            createAsteroids(10); 
            spaceship.hidden = false;
            resetShipPosition();
        }

        function isCenterSafe() {
            const safeRadius = 85; // raza safe fata de mijloc in pixeli
            const centerX = canvas.width / 2;  //centrul canvasului pe orizontala
            const centerY = canvas.height / 2;//centrul canvasului pe vert

            for (const asteroid of asteroids) {
                const distToCenter = Math.hypot(centerX - asteroid.x, centerY - asteroid.y);  //calculeaza distanta intre doua puncte in spatiul 2d
                if (distToCenter < safeRadius) {
                    return false; 
                }
            }
        return true; 
        }

        function resetShipPosition() {
            if (isCenterSafe()) {
                spaceship.x = canvas.width / 2;
                spaceship.y = canvas.height / 2;
                spaceship.thrust = { x: 0, y: 0 };
                spaceship.a = (90 / 180) * Math.PI; // nava orientata in sus
                spaceship.thrusting = false;
                spaceship.rot = 0;
                spaceship.hidden = false;
            } else {
        // daca centrul nu este safe verificam din nou dupa 1ms
                setTimeout(resetShipPosition, 1); 
            }
        }   


            const particles = [];  //stocare obiecte de tip Particle
            const asteroids = [];  //stocare obiecte de tip Asteroid
            const bullets = [];//stocare obiecte de tip Bullet

            
            document.getElementById(`resetHighScore`).addEventListener(`click`,resetHighScore);
            
                //apasare in jos a tastei
            document.addEventListener("keydown", (e) => {
                keysPressed[e.key] = true;
                if (e.key === "ArrowUp") spaceship.thrusting = true; // accelereaza
                if (e.key === "z") spaceship.rot = rotationSpeed // roteste stanga
                if (e.key === "c") spaceship.rot = -rotationSpeed; // roteste dreapta
                if (e.key === "ArrowDown") spaceship.thrustingDown = true;
                if (e.key === "x") spaceship.shoot();
                if (e.key === "ArrowLeft") spaceship.movingLeft = true;
                if (e.key === "ArrowRight") spaceship.movingRight = true;
            });
                //eliberarea tastei
            document.addEventListener("keyup", (e) => {
                keysPressed[e.key] = false;
                if (e.key === "ArrowUp") spaceship.thrusting = false; // opreste acceleratia
                if (e.key === "z" || e.key === "c") spaceship.rot = 0;// opreste rotatia
                if (e.key === "ArrowDown") spaceship.thrustingDown = false;
                if (e.key === "ArrowLeft") spaceship.movingLeft = false;
                if (e.key === "ArrowRight") spaceship.movingRight = false;
            });



            createAsteroids(10); 

                //butoane
            const leftButton = document.getElementById('leftButton');
            const thrustButton = document.getElementById('thrustButton');
            const rightButton = document.getElementById('rightButton');
            const fireButton = document.getElementById('fireButton');

                    //evenimente butoane touch
            leftButton.addEventListener('touchstart', () => spaceship.rot = rotationSpeed);
            leftButton.addEventListener('touchend', () => spaceship.rot = 0);

            rightButton.addEventListener('touchstart', () => spaceship.rot = -rotationSpeed);
            rightButton.addEventListener('touchend', () => spaceship.rot = 0);

            thrustButton.addEventListener('touchstart', () => spaceship.thrusting = true);
            thrustButton.addEventListener('touchend', () => spaceship.thrusting = false);

            fireButton.addEventListener('touchstart', () => spaceship.shoot());

            canvas.addEventListener('touchstart', (e) => {
                const touch = e.touches[0];
                startX = touch.clientX;
                startY = touch.clientY;
            });

            canvas.addEventListener('touchmove', (e) => {
                e.preventDefault();     // prevenire scrolling implicit
                const touch = e.touches[0];
                const deltaX = touch.clientX - startX;
                const deltaY = touch.clientY - startY;

            if (deltaY < -30) spaceship.thrusting = true;   //glisare in sus
            else spaceship.thrusting = false;

            if (deltaX > 30) spaceship.rot = -rotationSpeed;    // glisare in dreapta
            else if (deltaX < -30) spaceship.rot = rotationSpeed;   // glisare in stanga
            else spaceship.rot = 0;
            });

            canvas.addEventListener('touchend', () => {
                spaceship.thrusting = false;
                spaceship.rot = 0;
            });



            function endGame() {
                const playerName = prompt('Numele:');
                if (playerName) {
                    saveHighScore(score, playerName);
            }
            displayHighScores();
            resetGame();
            }
            
            
            function updateGame() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                //actualizam si desenam asteroizii
                asteroids.forEach((asteroid, index) => {
                    asteroid.update();
                    asteroid.draw();
                        // verificam coliziuni cu nava spatiala
                    if (spaceship.checkCollisionWithAsteroid(asteroid)) {
                            
                        if(!spaceship.hidden && !spaceship.particlesAlive){
                            for (let i = 0; i < 15; i++) { 
                                const angle = Math.random() * Math.PI * 2; 
                                const speed = Math.random() * 2;  
                                const particle = new Particle(spaceship.x, spaceship.y,"white", Math.cos(angle) * speed,Math.sin(angle) * speed,45);
                                particles.push(particle);
                            }
                            
                            lives--;
                            spaceship.hidden = true;
                            spaceship.particlesAlive = true;
                        }

                        if(lives > 0){
                            resetShipPosition();
                            spaceship.particlesAlive = false;
                        }
                        
                        if(lives === 0)
                        {
                            // cand se termina vietile resetam jocul
                            alert("Joc pierdut! Nu mai ai vieti.");
                            endGame();
                            resetGame();
                            return;
                        }
                        resetShipPosition(); 
                    }

                    // verificam coliziunile cu alti asteroizi
                    for (let j = index + 1; j < asteroids.length; j++) {
                        asteroid.checkCollisionWithAsteroid(asteroids[j]);
                    }
                });
                //actualizam si desenam particulele
                particles.forEach((particle, index) => {
                    if (particle.isAlive()) {
                        particle.update();
                        particle.draw();
                    } else {
                            particles.splice(index, 1); 
                    }
                });
                
                //actualizam si desenam rachetele
                bullets.forEach(bullet => {
                    bullet.update();
                    bullet.draw();
                    asteroids.forEach(asteroid => bullet.checkCollision(asteroid));
                });

                // stergem rachetele care trec de margine
                for (let i = bullets.length - 1; i >= 0; i--) {
                    if (!bullets[i].active) bullets.splice(i, 1);
                }

                spaceship.update();
                spaceship.draw();

                // vieti si scor
                ctx.fillStyle = "white";
                ctx.font = "25px Courier";
                ctx.fillText(`Vieti : ${lives}`, 90, 45);
                ctx.fillText(`Scor : ${score}`, 90, 20);

                checkGameCompletion();

                //textul de jos
                ctx.globalAlpha = 0.6; //setam ca textul sa fie mai sters si i se aplica doar textului
                ctx.fillStyle = "white";
                ctx.font = "23px Monospace";
                ctx.textAlign = "center";
                ctx.fillText ("1089 Mihai Inc", canvas.width/2, canvas.height-20);
                ctx.globalAlpha = 1; // resetam pt opacitate normala 
                requestAnimationFrame(updateGame);
            }

            updateGame();

            function checkGameCompletion() {
                if (asteroids.length === 0 && !levelInProgress) {
                    levelInProgress = true;
                    alert("Nivel terminat! Incepem urmatorul nivel.");
                    createAsteroids(10);
                    resetShipPosition();
                    levelInProgress = false;
                    if(lives  === 0){
                        endGame();
                    }
                }

            }
        function saveHighScore(score, playerName){
            // adaugam scorul curent in lista
            highScores.push({ score, name: playerName });
            //sortam descrescator dupa scor
            highScores.sort((a, b) => b.score - a.score);
            //pastram primele 5 locuri
            highScores = highScores.slice(0, 5);
            //salvare lista inn localStorage
            localStorage.setItem('highScores', JSON.stringify(highScores))
        }

        function displayHighScores() {
            const highScoreContainer = document.getElementById('highScoreContainer');
            highScoreContainer.innerHTML = `<h3>High Scores</h3>`;
            highScores.forEach((intrare, i) => {
            highScoreContainer.innerHTML += `<p>${i + 1}. ${intrare.name}: ${intrare.score}</p>`; //ce contine paragraful este generat dinamic
                                    //afiseaza pozitia jucatorului  + nume + scorul obtinut de jucator
        });
        }

        function resetHighScore(){
        const confirmationResetHighScore = confirm("Vrei sa resetezi clasamentul? ")
        if(confirmationResetHighScore){
        //stergere scor
            localStorage.removeItem(`highScores`);
            highScores = [];          //resetarea listei locale
            displayHighScores();  //actualizare clasament
            alert("Clasamentul a fost resetat.");
        }
        }
        displayHighScores();