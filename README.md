# 🚀 network-react 📦✨

A custom React hook for fetching data with advanced features such as retries, timeout, caching, and debouncing. It provides a convenient way to handle asynchronous data fetching in React components. 🌍⚡

---

# 📦 Installation 💻🔧

👉 Run this command in your terminal:

```bash
npm i network-react
```

🎯 Or, directly add it to your `package.json`:

```json
"network-react": "^1.1.0"
```

---

# 🚀 Example 🛠️✨
## ⚛️ React.js 🏗️

```javascript
import { useFetch } from "network-react";

function MyComponent() {
    const { data, loading, error, refetch } = useFetch("https://meaw.woof.com/data", {
        retries: 3,
        timeout: 5000,
        useCache: true,
    });
    
    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;
    
    return (
        <div>
            <h2>Fetched Data:</h2>
            <pre>{JSON.stringify(data, null, 2)}</pre>
            <button onClick={refetch}>Refetch</button>
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
✅ Retry mechanism with configurable attempts 🔄  
✅ Timeout support for fetch requests ⏱️  
✅ Caching for optimized performance 🗂️  
✅ Debouncing to prevent excessive requests ⏳  
✅ Abort ongoing fetch requests 🚫  

---

🎉 Happy coding! 🚀🔥