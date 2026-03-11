const API_KEY = 'csk-ehhcncxmtecph8vtxnw9re345txtj28j345ref48rwdm9k9r';
const BASE_URL = 'https://api.cerebras.ai/v1';
const MODEL = 'llama3.1-8b';

(async () => {
    try {
        const res = await fetch(`${BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
            },
            body: JSON.stringify({
                model: MODEL,
                stream: true,
                messages: [{ role: 'user', content: 'Give me a study plan for this week' }],
                // max_completion_tokens: 1024,
                temperature: 0.7,
            }),
        });

        if (!res.ok) {
            console.error("HTTP ERROR:", res.status, await res.text());
            return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let loopContent = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

            for (const line of lines) {
                const text = line.slice(6).trim();
                if (text === '[DONE]') continue;
                try {
                    const json = JSON.parse(text);
                    const delta = json.choices?.[0]?.delta;
                    if (delta?.content) {
                        loopContent += delta.content;
                    }
                } catch (e) { }
            }
        }
        console.log("FINAL CONTENT length:", loopContent.length);
        console.log(loopContent.slice(0, 100)); // preview
    } catch (err) {
        console.error("ERROR:", err.message);
    }
})();
