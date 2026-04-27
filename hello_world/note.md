# Cargo
- Cargo 是 Rust 的构建系统和包管理器
```bash
    # 构建项目,编译产物在./target/debug目录
    cargo build
    # 构建项目,编译产物在./target/release目录
    cargo build --release
    
    # 构建并运行项目
    cargo run
    # 检查代码，不产生编译文件
    cargo check
```

# 变量、常量和遮蔽（variables、constants and shadowed）
**变量**默认不可变，变量前加`mut`关键字成为`可变`
```bash
    let a = 5; #不可变
    let mut a = 5; #可变变量
```
**常量**默认不可变，永远不可变。默认大写且用下划线分隔
```bash
    const A = 5
```
**遮蔽**：定义一个与之前变量`同名`的新变量，使用这个变量名的时候，编译器看到的是第二个变量
- 与`mut`的区别,遮蔽是创建一个同名的新变量，可以与原变量是不同的数据类型，`mut`是给变量赋值
```bash
    let a = 5;
    let a = x + 1;
    println!("{a}"); #输出 6
```
# 数据类型
Rust是`静态类型`语言，在编译时就必须知道所有变量的类型。
- 标量类型（scalar）：整型、浮点型、布尔类型和字符类型
- 复合类型（compound types）:元组、数组
`元组`是一种将多个`不同类型的值`组合成一个复合类型的通用方式。元组长度声明后是固定的。

```bash
    fn main(){
        # 元组取出单个值使用模式匹配来解构元组
        let tup: (i32,f64,u8) = (5,4.2,1);
        let (x,y,z) = tup;
        println!("The value of y is: {y}");

        # 也可以使用点号（.）后跟值的索引来直接访问所需的元组元素
        let a = tup.0;
        let b = tup.1;
        let c = tup.2;
    }
```
`数组`，数组中每个元素都必须有`相同的类型`，数组的长度是固定的。

```bash
    fn main(){
        # 定义数组方式 1
        let a = [1,2,3];
        # 定义数组方式 2
        let a: [i32,3] = [1,2,3];   # i32是每个元素的类型，数字5表示数组的元素个数
        # 定义数组方式 3
        let a = [3,5];   # 数字3表示元素值，数字5表示元素个数。

        #访问数组元素
        let arr = [1,2,3,4,5];
        let a = arr.[0];
        let b = arr.[1];
    }
```
vector类型是标准库提供的一种类似数组的集合类型，数组长度不固定。不确定数组长度推荐使用vector，确定数组长度可使用array