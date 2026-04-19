import { registerCatalogRuntimeMiscCases } from "./catalog.runtime.misc.cases";
import { registerCatalogRuntimeProvisioningCases } from "./catalog.runtime.provisioning.cases";
import { registerCatalogRuntimeSellerCases } from "./catalog.runtime.seller.cases";

describe("catalog provisioning runtime", () => {
  registerCatalogRuntimeProvisioningCases();
  registerCatalogRuntimeSellerCases();
  registerCatalogRuntimeMiscCases();
});
