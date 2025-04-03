# 🚀 network-react 📦✨

A simple and efficient custom React hook for fetching data from APIs with built-in loading and error handling! 🌍⚡

---

# 📦 Installation 💻🔧

👉 Run this command in your terminal:

```bash
npm i network-react
```

🎯 Or, directly add it to your `package.json`:

```json
"network-react": "^1.0.1"
```

---

# 🚀 Example 🛠️✨
## ⚛️ React.js 🏗️

```javascript
import { useFetch } from "network-react";

function MyComponent() {
    const { data, loading, error } = useFetch("https://meaw.woof.com/data");
    
    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;
    
    return (
        <div>
            <h2>Fetched Data:</h2>
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
    );
}
```

---

# 🏆 Features 🛠️

✅ Simple API ✨  
✅ Built-in loading & error handling ⏳❌  
✅ Supports custom request options (GET, POST, etc.) 🛠️  
✅ Works with any REST API 🌍  
✅ TypeScript support 📜  
✅ Lightweight & efficient ⚡

---

🎉 Happy coding! 🚀🔥