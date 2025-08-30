module.exports = {
  async send({ to, subject, html, text }) {
    console.log('----- DEV EMAIL -----');
    console.log('To:', to);
    console.log('Subject:', subject);
    if (text) console.log('Text:\n', text);
    if (html) console.log('HTML:\n', html);
    console.log('---------------------');
    return { ok: true };
  }
};
