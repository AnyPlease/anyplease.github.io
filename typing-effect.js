document.addEventListener('DOMContentLoaded', () => {
  const target = document.getElementById('typed-name');

  const observer = new IntersectionObserver(([entry], obs) => {
    if(!entry.isIntersecting) return;
    new Typed('#typed-name', {
      strings:["Hi, I'm Dhruv."],
      typeSpeed:50, backSpeed:40, loop:false,
      showCursor:true, cursorChar:'|'
    });
    obs.disconnect();           // run exactly once
  }, { threshold:0.5 });

  observer.observe(target);
});
