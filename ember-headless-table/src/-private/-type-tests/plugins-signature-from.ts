import { expectTypeOf } from 'expect-type';
import { BasePlugin } from 'plugins/-private/base';

import type { SignatureFrom } from 'plugins/-private/base';

class ATableMeta {
  a = 1;
}
class AColumnMeta {
  ac = 1;
}
class ARowMeta {
  ar = 1;
}
class AOptions {
  ao = 1;
}
class AColumnOptions {
  aco = 1;
}

interface SignatureA {
  Meta: {
    Table: ATableMeta;
    Column: AColumnMeta;
    Row: ARowMeta;
  };
  Options: {
    Plugin: AOptions;
    Column: AColumnOptions;
  };
}

class PluginA<Signature = SignatureA> extends BasePlugin<Signature> {
  name = 'my-test-plugin';
}

// Test the tests
expectTypeOf<SignatureA>().toEqualTypeOf<SignatureA>();

// Tests that we can pluck the generic off of BasePlugin
expectTypeOf<SignatureFrom<BasePlugin<SignatureA>>>().toEqualTypeOf<SignatureA>();

// Tests that we can get the generic type off of a sub-type of BasePlugin
expectTypeOf<SignatureFrom<PluginA>>().toEqualTypeOf<SignatureA>();

// Tests that we can get the generic off of a sub-type passed to BasePlugin
class PluginC extends BasePlugin<SignatureA> {
  name = 'plugin-c';
}
expectTypeOf<SignatureFrom<PluginC>>().toEqualTypeOf<SignatureA>();

///////////////////////////////////////////

class PluginB extends BasePlugin<{ Meta: { Table: ATableMeta } }> {
  name = 'plugin-b';
}

expectTypeOf<SignatureFrom<PluginB>>().toEqualTypeOf<{
  Meta: {
    Table: ATableMeta;
  };
}>();
