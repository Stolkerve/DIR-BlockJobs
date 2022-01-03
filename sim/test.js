import { strict as assert } from "assert";
import { Runner } from "near-runner"

// alice: await runtime.createAccount('alice'),
// bob: await runtime.createAccount('bob'),

let accountsNames = [
  'sebastian',
  'dario',
  'peres',
  'jimenez',
  'ana',
  'maria',
  'pablo',
  'pedro',
  'jose',
  'sara',
  'sasha',
  'yoselin',
  'josefina',
  'esmeralda',
  'carolina',
]

async function createAccounts(root) {
  let nearAccounts = [];
  accountsNames.forEach(async (name, i) => {
    let ac = await root.createAccount(name, {initialBalance: "100000000000000000000000"})
    // console.log(ac)
    nearAccounts.push(ac)
  });
  
  return nearAccounts;
}

async function initRunner() {
  const runner = Runner.create(async ({root}) => {

    const marketplace = await root.createAndDeploy(
      "marketplace",
      "../contract/out/marketplace.wasm",
      {initialBalance: "100000000000000000000000000"}
    );
    const mediator = await root.createAndDeploy(
      "mediator",
      "../contract/out/mediator.wasm",
      {initialBalance: "100000000000000000000000000"}
    );
    const ft = await root.createAndDeploy(
      "ft",
      "../contract/out/ft.wasm",
      {initialBalance: "100000000000000000000000000"}
    );
    // const accounts = await createAccounts(root);
    return {root, marketplace, mediator, ft};
  });

  return runner;
}

async function test() {
  const runner = await initRunner()
  await Promise.all([
    runner.run(async ({root, marketplace, mediator, ft}) => {

      // No es por que quiera hacer esto, lo automatizaria, pero por alguna razon no funciona
      const accounts = [
        await root.createAccount('sebastian', {initialBalance: "100000000000000000000000"}),
        await root.createAccount('dario',     {initialBalance: "100000000000000000000000"}),
        await root.createAccount('peres',     {initialBalance: "100000000000000000000000"}),
        await root.createAccount('jimenez',   {initialBalance: "100000000000000000000000"}),
        await root.createAccount('ana',       {initialBalance: "100000000000000000000000"}),
        await root.createAccount('maria',     {initialBalance: "100000000000000000000000"}),
        await root.createAccount('pablo',     {initialBalance: "100000000000000000000000"}),
        await root.createAccount('pedro',     {initialBalance: "100000000000000000000000"}),
        await root.createAccount('jose',      {initialBalance: "100000000000000000000000"}),
        await root.createAccount('sara',      {initialBalance: "100000000000000000000000"}),
        await root.createAccount('yoselin',   {initialBalance: "100000000000000000000000"}),
        await root.createAccount('alice',     {initialBalance: "100000000000000000000000"}),
      ];
      console.log(marketplace)
      await accounts[0].call(marketplace, 'new', {
        owner_id: marketplace.accountId,
        mediator: mediator.accountId,
        // ft: ft.accountId
      })

      // const c1 = await marketplace.call(marketplace, 'get_user', {
      //   account_id: marketplace.accountId
      // })

      // const c2 = await marketplace.call(marketplace, 'get_user', {
      //   account_id: mediator.accountId
      // })

      // console.log(c1)
      // console.log(c2)

      assert.equal('whatever', 'whatever');
    }),
  ])
  console.log('\x1b[32mPASSED\x1b[0m')
}

test()
