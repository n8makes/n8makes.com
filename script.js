document.addEventListener('DOMContentLoaded', () => {
  // Your code to run after the DOM is ready
  console.log('DOM fully loaded and parsed');

  const button = document.getElementById("myButton");

  button.addEventListener("click", function(event) {
    event.preventDefault();
    alert("Hello Friend!");
  });
});