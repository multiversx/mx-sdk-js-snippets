import { Address, Balance, Nonce, TransactionHash } from "@elrondnetwork/erdjs";
import { assert } from "chai";
import { Storage } from "./storage";

describe("test storage", async function () {
    const Timeout = 10000;

    it("store and load breadcrumbs", async function () {
        this.timeout(Timeout);

        let storage = await Storage.create(createDatabaseName(this));

        await storage.storeBreadcrumb("foo", "typeX", "A", { value: 42 });
        await storage.storeBreadcrumb("foo", "typeX", "A", { value: 43 });
        await storage.storeBreadcrumb("foo", "typeX", "C", { value: 42 });
        await storage.storeBreadcrumb("foo", "typeY", "B", { value: 44 });
        await storage.storeBreadcrumb("bar", "typeY", "A", { value: 42 });

        let breadcrumb = await storage.loadBreadcrumb("foo", "A");
        assert.deepEqual(breadcrumb, { value: 43 });
        breadcrumb = await storage.loadBreadcrumb("foo", "B");
        assert.deepEqual(breadcrumb, { value: 44 });
        breadcrumb = await storage.loadBreadcrumb("bar", "A");
        assert.deepEqual(breadcrumb, { value: 42 });

        let breadcrumbs = await storage.loadBreadcrumbsByType("foo", "typeX");
        assert.lengthOf(breadcrumbs, 2);
        breadcrumbs = await storage.loadBreadcrumbsByType("foo", "typeY");
        assert.lengthOf(breadcrumbs, 1);
        breadcrumbs = await storage.loadBreadcrumbsByType("bar", "typeY");
        assert.lengthOf(breadcrumbs, 1);
        breadcrumbs = await storage.loadBreadcrumbsByType("foo", "typeMissing");
        assert.lengthOf(breadcrumbs, 0);

        await storage.destroy();
    });

    it("store & update interactions", async function () {
        this.timeout(Timeout);

        let storage = await Storage.create(createDatabaseName(this));

        let reference = await storage.storeInteraction("foo", {
            action: "stake",
            userAddress: new Address("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th"),
            contractAddress: new Address("erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu"),
            transactionHash: new TransactionHash(""),
            timestamp: "friday",
            round: 42,
            epoch: 1,
            blockNonce: new Nonce(7),
            hyperblockNonce: new Nonce(9),
            input: { foo: "bar" },
            transfers: {},
            output: {}
        });

        assert.isTrue(reference.valueOf() > 0);
        

        await storage.updateInteractionSetOutput(reference, { something: "something" });


        await storage.destroy();
    });

    it("store account snapshots", async function () {
        this.timeout(Timeout);

        let storage = await Storage.create(createDatabaseName(this));

        // Without reference to "before" / "after" interaction
        await storage.storeAccountSnapshot("foo", {
            timestamp: "friday",
            address: new Address("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th"),
            nonce: new Nonce(42),
            balance: Balance.egld(1),
            tokens: { RIDE: 1000, MEX: 1000 }
        });

        // With references to "before" / "after" interaction
        let interactionReference = await storage.storeInteraction("foo", {
            action: "doSomething",
            userAddress: new Address("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th"),
            contractAddress: new Address("erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu"),
            transactionHash: new TransactionHash(""),
            timestamp: "friday",
            round: 42,
            epoch: 1,
            blockNonce: new Nonce(7),
            hyperblockNonce: new Nonce(9),
            input: { foo: "bar" },
            transfers: {},
            output: { bar: "foo" }
        });

        let snapshotBefore = {
            timestamp: "friday",
            address: new Address("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th"),
            nonce: new Nonce(42),
            balance: Balance.egld(1),
            tokens: { RIDE: 1000, MEX: 1000 },
            takenBeforeInteraction: interactionReference
        };

        let snapshotAfter = {
            timestamp: "friday",
            address: new Address("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th"),
            nonce: new Nonce(43),
            balance: Balance.egld(2),
            tokens: { RIDE: 500, MEX: 500 },
            takenAfterInteraction: interactionReference
        };

        await storage.storeAccountSnapshot("foo", snapshotBefore);
        await storage.storeAccountSnapshot("foo", snapshotAfter);

        // TODO: Add some assertions.

        await storage.destroy();
    });

    function createDatabaseName(context: Mocha.Context): string {
        return `${context.runnable().fullTitle()}.sqlite`;
    }
});