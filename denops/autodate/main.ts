// =============================================================================
// File        : main.ts
// Author      : yukimemi
// Last Change : 2023/09/17 17:52:54.
// =============================================================================

import * as autocmd from "https://deno.land/x/denops_std@v6.0.1/autocmd/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.0.1/function/mod.ts";
import * as helper from "https://deno.land/x/denops_std@v6.0.1/helper/mod.ts";
import * as op from "https://deno.land/x/denops_std@v6.0.1/option/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v6.0.1/variable/mod.ts";
import type { Denops } from "https://deno.land/x/denops_std@v6.0.1/mod.ts";
import { assert, is } from "https://deno.land/x/unknownutil@v3.16.0/mod.ts";
import { batch } from "https://deno.land/x/denops_std@v6.0.1/batch/mod.ts";
import { format } from "https://deno.land/std@0.215.0/datetime/mod.ts";
import { merge } from "https://cdn.skypack.dev/lodash@4.17.21";

type Config = {
  [key: string]: {
    replace: [string, string][];
    event: autocmd.AutocmdEvent | autocmd.AutocmdEvent[];
    pat: string | string[];
    head: number;
    tail: number;
  };
};

let now = new Date();
let nowStr = now.toString();
let debug = false;
let notify = false;

let config: Config = {
  "*": {
    replace: [
      [
        "/(.*Last Change.*: ).*\\.$/i",
        '$1${format(now, "yyyy/MM/dd HH:mm:ss")}.',
      ],
    ],
    event: ["BufWritePre"],
    pat: "*",
    head: 13,
    tail: 13,
  },
};

let enable = true;

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
  await batch(denops, async () => {
    try {
      lines.forEach((line, i) => {
        let newLine = line;
        i = index + i;
        config.replace.forEach(async (rep) => {
          try {
            const re = eval(rep[0]) as RegExp;
            const after = rep[1];
            // clog({ i, line, re, after });
            if (re.test(line)) {
              newLine = newLine.replace(re, eval("`" + after + "`"));
              clog(`Update ${i}: [${line}] -> [${newLine}]`);
              await fn.setline(denops, i, newLine);
            }
          } catch (e) {
            helper.echoerr(denops, e);
          }
        });
      });
    } catch (e) {
      helper.echoerr(denops, e);
    }
  });
}

export async function main(denops: Denops): Promise<void> {
  // debug.
  debug = await vars.g.get(denops, "autodate_debug", debug);
  notify = await vars.g.get(denops, "autodate_notify", notify);
  // Merge user config.
  const userConfig = (await vars.g.get(denops, "autodate_config")) as Config;
  config = merge(config, userConfig);
  clog({ debug, config });

  denops.dispatcher = {
    async autodate(): Promise<void> {
      try {
        if (!enable) {
          clog(`autodate skip ! enable: [${enable}]`);
          return;
        }
        // Get filetype and filetype config.
        const ft = await op.filetype.get(denops);
        clog({ ft });

        const allConfig = config["*"];
        const ftConfig = config[ft];

        // Update now.
        now = new Date();

        if (now.toString() === nowStr) {
          clog(`Same time: [${nowStr}], skip !`);
          return;
        }
        nowStr = now.toString();

        for (const c of [allConfig, ftConfig]) {
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
        }
        if (notify && denops.meta.host === "nvim") {
          await helper.execute(
            denops,
            `lua vim.notify([[autodate: ${nowStr}]], vim.log.levels.INFO)`,
          );
        }
      } catch (e) {
        clog(e);
      }
    },

    // deno-lint-ignore require-await
    async change(e: unknown): Promise<void> {
      assert(e, is.Boolean);
      helper.echo(denops, `Autodate: ${e}`);
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
    Object.values(config).forEach((c) => {
      helper.define(
        c.event,
        c.pat,
        `call s:${denops.name}_request('autodate', [])`,
      );
    });
  });

  clog("dps-autodate has loaded");
}
