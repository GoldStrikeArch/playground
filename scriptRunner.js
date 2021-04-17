async function scriptRunner({ data, scriptFunc, terminateStore }) {
  const result = [];

  let passed = 0;
  let failed = 0;

  let run = true;

  let browser, context, page, unsub;

  try {
    console.log("before all step");

    for (let index = 0; index < data.length; index++) {
      let product = data[index];

      try {
        unsub = terminateStore.subscribe((value) => {
          if (value === "Stop") {
            run = false;
            throw new Error("Terminating the sript");
          }
        });

        ({ browser, context, page } = await playwrightSetup());

        console.log("Script begins for product#", index);

        //run a custom "script" on given product

        await scriptFunc({ context, page, product });

        product = { ...product, status: "Done" };

        await browser.close();
        passed++;
      } catch (error) {
        product = { ...product, status: `Failed; Reason: ${error.message}` };

        await browser.close();
        failed++;

        if (!run) {
          return result;
        }
      } finally {
        result.push(product);
        unsub();

        if (!run) {
          return result;
        }
      }
    }
  } finally {
    console.log("inside LAST finally");

    return { result, passed, failed };
  }
}
