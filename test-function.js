exports.handler = async function(event, context) {
  return {
    statusCode: 200,
    body: JSON.stringify({message: "Hallo von der Netlify-Funktion!"})
  };
}