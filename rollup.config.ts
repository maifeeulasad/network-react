// rollup.config.ts
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import terser from "@rollup/plugin-terser";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import type { RollupOptions, InputPluginOption } from "rollup";

const config: RollupOptions[] = [
    {
        input: "./index.ts",
        output: [
            {
                dir: "dist/cjs",
                format: "cjs",
                sourcemap: true,
                preserveModules: true,
                preserveModulesRoot: ".",
                exports: "named",
            },
            {
                dir: "dist/esm",
                format: "esm",
                sourcemap: true,
                preserveModules: true,
                preserveModulesRoot: ".",
            },
        ],
        plugins: [
            peerDepsExternal() as InputPluginOption,
            resolve(),
            commonjs(),
            typescript({ tsconfig: "./tsconfig.json" }),
            terser(),
        ],
        external: ["react"],
    },
    {
        input: "./index.ts",
        output: {
            dir: "dist/types",
            format: "es",
            preserveModules: true,
            preserveModulesRoot: ".",
        },
        plugins: [dts()],
    },
];

export default config;