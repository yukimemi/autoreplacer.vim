import { pod2markdown, pod2vimdoc } from "https://pax.deno.dev/yukimemi/deno-pod/mod.ts";

const pod = "./pod/autodate.pod";
const vimdoc = "./doc/autodate.txt";
const markdown = "./README.md";

await pod2vimdoc(pod, vimdoc);
await pod2markdown(pod, markdown);
