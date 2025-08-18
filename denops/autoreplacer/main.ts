// =============================================================================
// File        : main.ts
// Author      : yukimemi
// Last Change : 2025/04/27 07:54:28.
// =============================================================================

import * as autocmd from "jsr:@denops/std@7.6.0/autocmd";
import * as fn from "jsr:@denops/std@7.6.0/function";
import * as helper from "jsr:@denops/std@7.6.0/helper";
import * as op from "jsr:@denops/std@7.6.0/option";
import * as vars from "jsr:@denops/std@7.6.0/variable";
import type { Denops } from "jsr:@denops/std@7.6.0";
import { batch } from "jsr:@denops/std@7.6.0/batch";
import { format } from "jsr:@std/datetime@0.225.5";
import { merge } from "jsr:@es-toolkit/es-toolkit@1.39.10";
import { z } from "npm:zod@4.0.17";

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
            console.error(e);
          }
        });
      });
    } catch (e) {
      console.error(e);
    }
  });
}

export async function main(denops: Denops): Promise<void> {
  // debug.
  debug = await vars.g.get(denops, "autoreplacer_debug", debug);
  notify = await vars.g.get(denops, "autoreplacer_notify", notify);
  // Merge user config.
  const userConfig = (await vars.g.get(denops, "autoreplacer_config")) as Config;
  config = merge(config, userConfig);
  clog({ debug, config });

  denops.dispatcher = {
    async autoreplace(): Promise<void> {
      try {
        if (!enable) {
          clog(`autoreplacer skip ! enable: [${enable}]`);
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
            `lua vim.notify([[autoreplacer: ${nowStr}]], vim.log.levels.INFO)`,
          );
        }
      } catch (e) {
        clog(e);
      }
    },

    // deno-lint-ignore require-await
    async change(e: unknown): Promise<void> {
      const eParsed = z.boolean().parse(e);
      helper.echo(denops, `autoreplacer: ${e}`);
      enable = eParsed;
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
    command! EnableAutoReplacer call s:${denops.name}_notify('change', [v:true])
    command! DisableAutoReplacer call s:${denops.name}_notify('change', [v:false])
  `,
  );

  await autocmd.group(denops, denops.name, (helper) => {
    helper.remove();
    // Set all filetype autocmd.
    Object.values(config).forEach((c) => {
      helper.define(
        c.event,
        c.pat,
        `call s:${denops.name}_request('autoreplace', [])`,
      );
    });
  });

  clog("autoreplacer has loaded");
}
