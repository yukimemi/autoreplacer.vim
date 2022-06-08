import * as autocmd from "https://deno.land/x/denops_std@v3.3.1/autocmd/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v3.3.1/function/mod.ts";
import * as helper from "https://deno.land/x/denops_std@v3.3.1/helper/mod.ts";
import * as op from "https://deno.land/x/denops_std@v3.3.1/option/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v3.3.1/variable/mod.ts";
import type { Denops } from "https://deno.land/x/denops_std@v3.3.1/mod.ts";
import { Lock } from "https://deno.land/x/async@v1.1.5/mod.ts";
import { batch } from "https://deno.land/x/denops_std@v3.3.1/batch/mod.ts";
import { format } from "https://deno.land/std@0.141.0/datetime/mod.ts";
import { merge } from "https://cdn.skypack.dev/lodash@4.17.21";
import { assertBoolean } from "https://deno.land/x/unknownutil@v2.0.0/mod.ts";

type Config = {
  [key: string]: {
    keywords: [string, string][];
    events: autocmd.AutocmdEvent[];
    head: number;
    tail: number;
  };
};

let now = new Date();
let debug = false;

let config: Config = {
  "*": {
    keywords: [
      [
        "/(.*Last Change.*: ).*\\.$/i",
        '$1${format(now, "yyyy/MM/dd HH:mm:ss")}.',
      ],
    ],
    // events: ["BufUnload", "FileWritePre", "BufWritePre"],
    events: ["BufWritePre"],
    head: 10,
    tail: 10,
  },
};

let enable = true;

const lock = new Lock();

// deno-lint-ignore no-explicit-any
const clog = (...data: any[]): void => {
  if (debug) {
    console.log(...data);
  }
};
clog(format(now, "yyyy/MM/dd HH:mm:ss"));

async function replaceLine(
  denops: Denops,
  config: Config[string],
  lines: string[],
  index: number,
): Promise<void> {
  // deno-lint-ignore require-await
  return await batch(denops, async () => {
    lines.forEach((line, i) => {
      let newLine = line;
      i = index + i;
      config.keywords.forEach(async (keyword) => {
        const re = eval(keyword[0]) as RegExp;
        const after = keyword[1];
        // clog({ i, line, re, after });
        if (re.test(line)) {
          newLine = newLine.replace(re, eval("`" + after + "`"));
          clog(`Update ${i}: [${line}] -> [${newLine}]`);
          await fn.setline(denops, i, newLine);
        }
      });
    });
  });
}

export async function main(denops: Denops): Promise<void> {
  // debug.
  debug = await vars.g.get(denops, "autodate_debug", false);
  // Merge user config.
  const userConfig = (await vars.g.get(denops, "autodate_config")) as Config;
  config = merge(config, userConfig);
  clog({ debug, config });

  denops.dispatcher = {
    async autodate(): Promise<void> {
      try {
        await lock.with(async () => {
          if (!enable) {
            clog(`autodate skip ! enable: [${enable}]`);
            return;
          }
          // Get filetype and filetype config.
          const ft = (await op.filetype.get(denops));
          clog({ ft });

          const allConfig = config["*"];
          const ftConfig = config[ft];

          // Update now.
          now = new Date();

          [allConfig, ftConfig].forEach(async (c) => {
            // clog({ c });
            if (c == null) {
              return;
            }
            // Get head and tail.
            const head = await fn.getline(denops, 1, c.head);
            const lastline = await fn.line(denops, "$");
            const tail = await fn.getline(denops, lastline - c.tail, lastline);

            await replaceLine(denops, c, head, 1);
            await replaceLine(denops, c, tail, lastline - c.tail);
          });
        });
      } catch (e) {
        clog(e);
      }
    },

    // deno-lint-ignore require-await
    async change(e: unknown): Promise<void> {
      assertBoolean(e);
      console.log(`Autodate: ${e}`);
      enable = e;
    },
  };

  await helper.execute(
    denops,
    `
    function! s:${denops.name}_notify(method, params) abort
      call denops#plugin#wait_async('${denops.name}', function('denops#notify', ['${denops.name}', a:method, a:params]))
    endfunction
    function! s:${denops.name}_request(method, params) abort
      call denops#plugin#wait('${denops.name}')
      call denops#request('${denops.name}', a:method, a:params)
    endfunction
    command! EnableAutodate call s:${denops.name}_notify('change', [v:true])
    command! DisableAutodate call s:${denops.name}_notify('change', [v:false])
  `,
  );

  await autocmd.group(denops, denops.name, (helper) => {
    helper.remove();
    // Set all filetype autocmd.
    Object.keys(config).forEach((ft) => {
      config[ft].events.forEach((e) => {
        helper.define(
          e,
          ft,
          `call s:${denops.name}_request('autodate', [])`,
        );
      });
    });
  });

  clog("dps-autodate has loaded");
}
