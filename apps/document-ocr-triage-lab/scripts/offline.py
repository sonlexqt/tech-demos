"""Linux seccomp: deny IPv4/IPv6 socket creation in this process and descendants."""
import ctypes, errno, os, socket, sys
lib=ctypes.CDLL('libseccomp.so.2',use_errno=True)
lib.seccomp_init.argtypes=[ctypes.c_uint32]; lib.seccomp_init.restype=ctypes.c_void_p
lib.seccomp_syscall_resolve_name.argtypes=[ctypes.c_char_p]; lib.seccomp_syscall_resolve_name.restype=ctypes.c_int
lib.seccomp_rule_add.argtypes=[ctypes.c_void_p,ctypes.c_uint32,ctypes.c_int,ctypes.c_uint]
lib.seccomp_load.argtypes=[ctypes.c_void_p]
ctx=lib.seccomp_init(0x7fff0000)
assert ctx
class ArgCmp(ctypes.Structure):
 _fields_=[('arg',ctypes.c_uint),('op',ctypes.c_int),('a',ctypes.c_uint64),('b',ctypes.c_uint64)]
lib.seccomp_rule_add_array.argtypes=[ctypes.c_void_p,ctypes.c_uint32,ctypes.c_int,ctypes.c_uint,ctypes.POINTER(ArgCmp)]
for family in [socket.AF_INET,socket.AF_INET6]:
 rule=ArgCmp(0,4,family,0) # SCMP_CMP_EQ
 assert lib.seccomp_rule_add_array(ctx,0x50000|errno.EPERM,lib.seccomp_syscall_resolve_name(b'socket'),1,ctypes.byref(rule))==0
assert lib.seccomp_load(ctx)==0
for family in [socket.AF_INET,socket.AF_INET6]:
 try:
  socket.socket(family); raise AssertionError('Network restriction failed')
 except PermissionError:
  pass
print('Verified: IPv4/IPv6 socket creation denied (EPERM); inherited by test process.',flush=True)
os.execvp(sys.argv[1],sys.argv[1:])
