(module (import "console" "log" (func $log (param i32))) (func $add (param i32) (param i32) (local lhs i32) (result i32) get_local 0 get_local 1 f32.const 5 i32.add) (export add (func $add)))
