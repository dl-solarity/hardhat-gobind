import { assert } from "chai";
import Generator from "../src/abigen/generator";
import { useEnvironment } from "./helpers";

describe("GoBind Generator class", function () {
  useEnvironment("hardhat-project-undefined-config");

  it("_contains should correctly process paths", function () {
    const instance = new Generator(this.env);
    const pathList = ["contracts/interfaces", "contracts/A.sol", "contracts/sub/B.sol", "contracts/sub/sub2/sub3"];
    const testCases = [
      { src: "contracts/A.sol", exp: true },
      { src: "contracts/interfaces/I.sol", exp: true },
      { src: "contracts/interfaces/mock/M.sol", exp: true },
      { src: "contracts/sub/sub2/sub3/C.sol", exp: true },
      { src: "contracts/sub/sub2/sub3/4/5/6/7/D.sol", exp: true },

      { src: "A.sol", exp: false },
      { src: "sub/B.sol", exp: false },
      { src: "sub/sub2/sub3/A.sol", exp: false },
      { src: "sub2/sub3/A.sol", exp: false },
      { src: "contracts/B.sol", exp: false },
      { src: "above/contracts/A.sol", exp: false },
      { src: "above/contracts/interfaces/I.sol", exp: false },
    ];

    testCases.forEach((c) => assert.equal(instance._contains(pathList, c.src), c.exp));
  });
});
