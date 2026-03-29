document.addEventListener("DOMContentLoaded", () => {
    // Reveal animation delay for list items
    const insights = document.querySelectorAll('.insight-list li');
    insights.forEach((li, index) => {
        li.style.opacity = '0';
        li.style.transform = 'translateY(10px)';
        li.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        setTimeout(() => {
            li.style.opacity = '1';
            li.style.transform = 'translateY(0)';
        }, 500 + (index * 150));
    });

    // Randomize live values slightly to simulate live dashboard
    const tempValue = document.querySelector('.metric:nth-child(1) .value');
    const humValue = document.querySelector('.metric:nth-child(2) .value');
    
    setInterval(() => {
        const baseTemp = 32.4;
        const baseHum = 64;
        
        const tempVariation = (Math.random() * 0.4 - 0.2).toFixed(1);
        const humVariation = Math.floor(Math.random() * 3 - 1);
        
        tempValue.innerHTML = `${(baseTemp + parseFloat(tempVariation)).toFixed(1)}<span class="unit">°C</span>`;
        humValue.innerHTML = `${baseHum + humVariation}<span class="unit">%</span>`;
    }, 4000);
});
