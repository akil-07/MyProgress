import useTaskStore from './src/store/taskStore.js'
import { askCerebrasStream } from './src/services/cerebras.js'

(async () => {
    try {
        const text = await askCerebrasStream(
            [{ role: 'user', content: 'Give me a short study plan' }],
            (chunk) => {
                console.log("Chunk:", chunk.length);
            },
            new AbortController().signal
        );
        console.log("FINAL:", text);
    } catch (err) {
        console.error("ERROR:", err.message);
    }
})();
