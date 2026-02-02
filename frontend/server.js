const express = require('express');
const path = require('path');
const app = express();

// Σερβίρουμε τον φάκελο build ως στατικά αρχεία
app.use(express.static(path.join(__dirname, 'build')));

// Για οποιοδήποτε άλλο request, στέλνουμε το index.html (για να δουλεύει το React Router)
app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Ξεκινάμε στη θύρα 3000
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Frontend running on port ${PORT}`);
});