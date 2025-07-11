document.addEventListener('DOMContentLoaded', function () {
    const sections = document.querySelectorAll('.content-section');

    const options = {
        root: null, // it is the viewport
        threshold: 0.1, // 10% of the item must be visible
        rootMargin: "0px"
    };

    const observer = new IntersectionObserver(function (entries, observer) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Stop observing once it's visible
            }
        });
    }, options);

    sections.forEach(section => {
        observer.observe(section);
    });
});