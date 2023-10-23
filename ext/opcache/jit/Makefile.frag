ifdef IR_TARGET
# New IR based JIT
$(builddir)/jit/ir/minilua: $(srcdir)/jit/ir/dynasm/minilua.c
	$(BUILD_CC) $(srcdir)/jit/ir/dynasm/minilua.c -lm -o $@

$(builddir)/jit/ir/ir_emit_$(DASM_ARCH).h: $(srcdir)/jit/ir/ir_$(DASM_ARCH).dasc $(srcdir)/jit/ir/dynasm/*.lua $(builddir)/jit/ir/minilua
	$(builddir)/jit/ir/minilua $(srcdir)/jit/ir/dynasm/dynasm.lua  $(DASM_FLAGS) -o $@ $(srcdir)/jit/ir/ir_$(DASM_ARCH).dasc

$(builddir)/jit/ir/ir_emit.lo: \
	$(srcdir)/jit/ir/ir_emit.c $(builddir)/jit/ir/ir_emit_$(DASM_ARCH).h

$(builddir)/jit/ir/gen_ir_fold_hash: $(srcdir)/jit/ir/gen_ir_fold_hash.c $(srcdir)/jit/ir/ir_strtab.c
	$(BUILD_CC) -D${IR_TARGET} -DIR_PHP -DIR_PHP_MM=0 -o $@ $<

$(builddir)/jit/ir/ir_fold_hash.h: $(builddir)/jit/ir/gen_ir_fold_hash $(srcdir)/jit/ir/ir_fold.h $(srcdir)/jit/ir/ir.h
	$(builddir)/jit/ir/gen_ir_fold_hash < $(srcdir)/jit/ir/ir_fold.h > $(builddir)/jit/ir/ir_fold_hash.h

$(builddir)/jit/ir/ir.lo: \
	$(builddir)/jit/ir/ir_fold_hash.h

$(builddir)/jit/zend_jit.lo: \
	$(srcdir)/jit/zend_jit_helpers.c \
	$(srcdir)/jit/zend_jit_ir.c

else
# Old DynAsm based JIT
$(builddir)/minilua: $(srcdir)/jit/dynasm/minilua.c
	$(BUILD_CC) $(srcdir)/jit/dynasm/minilua.c -lm -o $@

$(builddir)/jit/zend_jit_$(DASM_ARCH).c: $(srcdir)/jit/zend_jit_$(DASM_ARCH).dasc $(srcdir)/jit/dynasm/*.lua $(builddir)/minilua
	$(builddir)/minilua $(srcdir)/jit/dynasm/dynasm.lua  $(DASM_FLAGS) -o $@ $(srcdir)/jit/zend_jit_$(DASM_ARCH).dasc

$(builddir)/jit/zend_jit.lo: \
	$(builddir)/jit/zend_jit_$(DASM_ARCH).c \
	$(srcdir)/jit/zend_jit_helpers.c \
	$(srcdir)/jit/zend_jit_disasm.c \
	$(srcdir)/jit/zend_jit_gdb.c \
	$(srcdir)/jit/zend_jit_perf_dump.c \
	$(srcdir)/jit/zend_jit_vtune.c \
	$(srcdir)/jit/zend_jit_trace.c \
	$(srcdir)/jit/zend_elf.c

endif

# For non-GNU make, jit/zend_jit.lo and ./jit/zend_jit.lo are considered distinct targets.
# Use this workaround to allow building from inside ext/opcache.
jit/zend_jit.lo: $(builddir)/jit/zend_jit.lo
