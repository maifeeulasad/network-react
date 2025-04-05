import { exec } from 'child_process';

const port = 5173;

exec(`lsof -i :${port} -t`, (err, stdout) => {
    if (err) {
        console.error(`Error finding process on port ${port}:`, err.message);
        return;
    }

    const pid = stdout.trim();
    if (pid) {
        exec(`kill -9 ${pid}`, (killErr) => {
            if (killErr) {
                console.error(`Error killing process ${pid}:`, killErr.message);
            } else {
                console.log(`Successfully killed process on port ${port} (PID: ${pid})`);
            }
        });
    } else {
        console.log(`No process found running on port ${port}`);
    }
});