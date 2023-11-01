// Carries out functionalities associated with textarea (prolog code input area).
document.addEventListener('DOMContentLoaded', () => {
  var textarea = document.querySelector('.code-input-area');
  var header = document.querySelector('header');
  var main = document.querySelector('main');
  var clearButton = document.querySelector('.clear-button');

  // Store the initial height and max height of the textarea.
  var originalHeight = textarea.offsetHeight;
  var maxHeight = 25;

  // Calculate the total height of the header including all its children elements.
  var headerHeight = header.offsetHeight;

  // Function that adjusts the height of textarea depending on the presence of text.
  function adjustTextAreaHeight() {
    var hasText = textarea.value.trim().length > 0 // Boolean set tot true if text is found in textarea.
    if (hasText) {
      textarea.style.height = 'auto'; // Reset height for proper calculation.
      var scrollHeight = textarea.scrollHeight;
      var expandedHeight = Math.max(originalHeight, scrollHeight - 40);
      textarea.style.height = expandedHeight + 'px';
      textarea.style.maxHeight = 'none'; // Disable max-height property when expanded.
      header.style.height = (headerHeight + expandedHeight - originalHeight) + 'px';
      main.style.gridTemplateRows = '[row1] auto [row2] auto';
    } else {
      textarea.style.height = originalHeight + 'px';
      textarea.style.maxHeight = maxHeight + 'px'; // Apply max-height property when text is present.
      header.style.height = headerHeight + 'px';
      main.style.gridTemplateRows = '[row1] 45% [row2] auto';
    }
  }

  // Check textarea content on input.
  textarea.addEventListener('input', adjustTextAreaHeight);

  // Call adjustTextAreaHeight() after DOM content has loaded.
  adjustTextAreaHeight();

  // Clears text from the textarea and adjusts height accordingly.
  clearButton.addEventListener('click', () => {
    textarea.value = ''; // Reset by setting the value of the textarea to an empty string.
    adjustTextAreaHeight(); // Reset to original height.
  });
});