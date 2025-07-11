document.addEventListener('DOMContentLoaded', function () {
    var options = {
        strings: ["Hi, I'm dhruv"],
        typeSpeed: 50,  // Speed of typing in milliseconds
        backSpeed: 50,   // Speed of deleting in milliseconds
        loop: false,     // Do not loop the animation
        showCursor: true, // Show the blinking cursor
        cursorChar: '|',  // Set the cursor character
        contentType: 'html', // Ensure it renders HTML correctly
    };

    var typed = new Typed('#typed-name', options);
});