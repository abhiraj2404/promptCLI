import enquirer from "enquirer";
const { Select, prompt: enquirerPrompt, Input } = enquirer;
import axios from "axios";

let selectedModel = "Hermes 3 405B"
let message = "";
let stat = true;

const gray = '\x1b[90m'; // Gray text for "disabled" effect
const reset = '\x1b[0m'; // Reset to default

const spinnerChars = [ '-', '\\', '|', '/' ]; // Spinner characters
let currentSpinnerIndex = 0;
let spinnerInterval;

// Function to start the loading spinner
function startSpinner(spinnerText) {
    spinnerInterval = setInterval(() => {
        process.stdout.write(`\r${spinnerText}... ${spinnerChars[ currentSpinnerIndex ]}`);
        currentSpinnerIndex = (currentSpinnerIndex + 1) % spinnerChars.length;
    }, 100); // Change spinner every 100ms
}

// Function to stop the spinner
function stopSpinner() {
    clearInterval(spinnerInterval);
    process.stdout.write('\r'); // Clear the spinner and print done message
}

function markdownToConsole(markdown) {
    // Convert Markdown to console-friendly text
    return markdown
        .replace(/^(#{1,6})\s*(.*)$/gm, (match, hashes, title) => {
            const level = hashes.length; // Heading level
            const prefix = '#'.repeat(level) + ' '; // Create heading prefix
            return `${prefix}${title}`; // Return formatted heading
        })
        .replace(/\*\*(.*?)\*\*/g, (match, text) => `\x1b[1m${text}\x1b[0m`) // Bold
        .replace(/\*(.*?)\*/g, (match, text) => `\x1b[3m${text}\x1b[0m`) // Italics
        .replace(/`(.*?)`/g, (match, text) => `\x1b[32m${text}\x1b[0m`) // Inline code (green)
        .replace(/\n/g, '\n'); // Keep new lines intact
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function typeEffect(text, delay = 100) {
    for (let index = 0; index < text.length; index++) {
        process.stdout.write(text[ index ]);  // Print each character
        await wait(delay);  // Wait for the specified delay
    }
    process.stdout.write('\n');  // Print a new line when done
}


const selectModel = async () => {
    startSpinner("Fetching models");
    const response = await axios.get('http://localhost:3000/models');
    stopSpinner();
    const select_prompt = new Select({
        name: "model",
        message: "Pick a model",
        choices: response.data.modelNames,
    });

    await select_prompt.run().then((ans) => {
        selectedModel = ans;
        console.log(selectedModel + '\n')
    })
        .catch((error) => {
            console.log(error);
        })
}

const askPrompt = async () => {

    const inputPrompt = new Input({
        message: 'What can i help you with? \n',
        initial: ` ${gray}type ${reset}q ${gray}or ${reset}quit${gray} to exit${reset}`
    });

    await inputPrompt.run()
        .then((answer) => {
            message = answer;
        })
        .catch(console.log);

    if (message == 'q' || message == 'quit') {
        stat = false;
        return
    }

    startSpinner("Loading");
    try {
        const response = await axios.post('http://localhost:3000/chat', {
            model: selectedModel,
            message: message
        })
        stopSpinner();

        const formattedresponse = markdownToConsole(response.data.message)
        await typeEffect(formattedresponse + '\n', 1);  // 100ms delay between each character
        // console.log('\n' +  + '\n\n');

    } catch (error) {
        console.log(error)
    }
}

const startApplication = async () => {
    await selectModel();
    while (stat == true) {
        await askPrompt();
    }
}

startApplication();

// console.log()
