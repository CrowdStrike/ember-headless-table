# [1.1.0](https://github.com/CrowdStrike/ember-headless-table/compare/v1.0.1...v1.1.0) (2022-11-08)


### Features

* **plugin, resizing:** add helper for knowing if a column has a resize handle ([f525f50](https://github.com/CrowdStrike/ember-headless-table/commit/f525f50b4002766145187e8c19cce84e62605839))

## [1.0.1](https://github.com/CrowdStrike/ember-headless-table/compare/v1.0.0...v1.0.1) (2022-11-06)


### Bug Fixes

* **deps:** update dependency highlightjs-glimmer to v2 ([0881e12](https://github.com/CrowdStrike/ember-headless-table/commit/0881e12bb091daf711e3712151f26b6e6cd9ace5))

# 1.0.0 (2022-11-02)


### Bug Fixes

* **column-reordering:** reordering reactivity restored ([bf8153c](https://github.com/CrowdStrike/ember-headless-table/commit/bf8153c945e7215dd286ad74b9ffb2b77b3a4e47))
* **columnReordering:** rework how order state is maintained ([39ae71e](https://github.com/CrowdStrike/ember-headless-table/commit/39ae71ebb825d94d939fa5327ee75352734e92fd))
* **columnResizing:** fix the resize-handle modifier ([e17c232](https://github.com/CrowdStrike/ember-headless-table/commit/e17c23221c92d1507ef9b357311f6c3c978cbd12))
* **columnResizing:** resizeHandle modifier needs to be an ember-modifier ([90f7577](https://github.com/CrowdStrike/ember-headless-table/commit/90f7577512e82ac44e02e681860634ac7707d8d3))
* **columnVisibility:** bug where default hidden could not be unhidden ([e6b7239](https://github.com/CrowdStrike/ember-headless-table/commit/e6b72399b9efecc64ee056321bbabfb56eee5302))
* **columnVisibility:** work around a bug with tracked-built-ins' delete not being reactive ([ce62498](https://github.com/CrowdStrike/ember-headless-table/commit/ce624988ea72f0d471002ba4472eda5886ab9e0c))
* **columnVisibilty:** bug where default / preferences clearing calculation was incorrect ([e3e8480](https://github.com/CrowdStrike/ember-headless-table/commit/e3e84805e0a42c70d098a45f206a42e7be4b918f))
* **deps:** update dependency @ember/test-waiters to ^3.0.2 ([dcb45d1](https://github.com/CrowdStrike/ember-headless-table/commit/dcb45d19677c3cbc3ad38066ed2923f9e2974a37))
* **resizing:** resizing depends on column order, not just visibility ([6ac95ef](https://github.com/CrowdStrike/ember-headless-table/commit/6ac95ef47b02bf191103d8cca9d19b350e2a1342))


### Features

* **columnReordering:** preferences are now persisted and read from ([96e13c1](https://github.com/CrowdStrike/ember-headless-table/commit/96e13c10f4a9edf700ee5f7aaa1ecf784568ad33))
* initial implementation ([0fc2cbc](https://github.com/CrowdStrike/ember-headless-table/commit/0fc2cbcd5e274836ca6ab41fe2b9379a6adda812))
* **plugin:** implement row selection plugin ([e46ce50](https://github.com/CrowdStrike/ember-headless-table/commit/e46ce50480fcb510b88074fadd92027e6ffa01d9))
* **plugins:** simplify working with columns among plugins ([48ef0bb](https://github.com/CrowdStrike/ember-headless-table/commit/48ef0bbfba8cf677be09c5c40e8152b46a64e074))
* **plugin:** sticky columns ([b9b8bfa](https://github.com/CrowdStrike/ember-headless-table/commit/b9b8bfa476490af783d78f2992d9278874e33608))
* **table:** support [@use](https://github.com/use) ([6561c30](https://github.com/CrowdStrike/ember-headless-table/commit/6561c305f1998c9ce0283b9dfcd79f45fd7aa7d4))


### BREAKING CHANGES

* brand new addon
- copied code from internal project
- successful build

This is an incremental step, as there is some dev work yet to complete
- [ ] finish plugins work
- [ ] rename `@crowdstrike/ember-headless-table` to `ember-headless-table`
- [ ] Button up C.I.
- [ ] Create docs site with lots of examples, how to write plugins, etc
