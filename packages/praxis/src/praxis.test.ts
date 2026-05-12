import { describe, expect, it } from 'bun:test'
import { Zygon } from '@herodot-app/zygon'
import { Praxis } from './praxis'
import { Task } from './task'

describe('Praxis', () => {
  describe('Praxis.create', () => {
    it('creates a Praxis from a synchronous function', async () => {
      const praxis = Praxis.create((x: number) => x * 2)

      const result = await praxis.run(21)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(42)
    })

    it('creates a Praxis from an async function', async () => {
      const praxis = Praxis.create(async (x: number) => {
        await Promise.resolve()
        return x + 1
      })

      const result = await praxis.run(10)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(11)
    })

    it('creates a Praxis that can be piped', async () => {
      const praxis = Praxis.create((x: number) => x * 2).pipe(result => {
        if (Zygon.isLeft(result)) {
          return result.left + 10
        }

        return result
      })

      const result = await praxis.run(20)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(50)
    })
  })

  describe('Praxis constructor', () => {
    it('exposes the task via the task property', () => {
      const task = Task.create({ run: () => 42 })
      const praxis = new Praxis(task)

      expect(praxis.task).toBe(task)
    })
  })

  describe('Praxis.pipe', () => {
    it('chains a function onto the praxis', async () => {
      const praxis = Praxis.create((x: number) => x + 1).pipe(result =>
        result.left ? result.left * 2 : result,
      )

      const result = await praxis.run(10)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(22)
    })

    it('preserves input type through pipe', async () => {
      const praxis = Praxis.create((x: string) => x.toUpperCase()).pipe(
        result => (result.left ? result.left.length : result),
      )

      const result = await praxis.run('hello')

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(5)
    })

    it('handles async piped functions', async () => {
      const praxis = Praxis.create((x: number) => x * 2).pipe(async result => {
        await Promise.resolve()

        return result.left ? result.left + 100 : result
      })

      const result = await praxis.run(5)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(110)
    })

    it('handles errors in piped functions', async () => {
      const praxis = Praxis.create(() => 42).pipe(() => {
        throw new Error('pipe error')
      })

      const result = await praxis.run()

      expect(Zygon.isRight(result)).toBe(true)
    })

    it('can chain multiple pipes', async () => {
      const praxis = Praxis.create((x: number) => x)
        .pipe(result => (result.left ? result.left + 1 : result))
        .pipe(result => (result.left ? result.left * 2 : result))
        .pipe(result => (result.left ? result.left + 10 : result))

      const result = await Task.run(praxis.task, 5)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(22)
    })

    it('passes through Right values from the original task', async () => {
      const praxis = Praxis.create(() => {
        throw new Error('original error')
      }).pipe(result => {
        if (Zygon.isLeft(result)) {
          return result.left * 2
        }

        return result
      })

      const result = await praxis.run()

      expect(Zygon.isRight(result)).toBe(true)
    })
  })

  describe('Praxis.chain', () => {
    it('transforms Left values from the praxis', async () => {
      const praxis = Praxis.create((x: number) => x + 1).chain(
        value => value * 2,
      )

      const result = await praxis.run(10)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(22)
    })

    it('stops chain on Right values', async () => {
      const praxis = Praxis.create(() => {
        throw new Error('chain error')
      }).chain(value => value * 2)

      const result = await praxis.run()

      expect(Zygon.isRight(result)).toBe(true)
    })

    it('preserves input type through chain', async () => {
      const praxis = Praxis.create((x: string) => x.toUpperCase()).chain(
        value => value.length,
      )

      const result = await praxis.run('hello')

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(5)
    })

    it('handles async chain functions', async () => {
      const praxis = Praxis.create((x: number) => x * 2).chain(async value => {
        await Promise.resolve()
        return value + 100
      })

      const result = await praxis.run(5)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(110)
    })

    it('can chain multiple times', async () => {
      const praxis = Praxis.create((x: number) => x)
        .chain(value => value + 1)
        .chain(value => value * 2)
        .chain(value => value + 10)

      const result = await praxis.run(5)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(22)
    })

    it('can mix chain and pipe', async () => {
      const praxis = Praxis.create((x: number) => x)
        .chain(value => value + 1)
        .pipe(result => (result.left ? result.left * 2 : result))
        .chain(value => value + 10)

      const result = await praxis.run(5)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(22)
    })
  })

  describe('Praxis.chainRight', () => {
    it('transforms Right values from the praxis', async () => {
      const praxis = Praxis.create(() => {
        throw new Error('error')
      }).chainRight(() => 5)

      const result = await praxis.run()

      expect(Zygon.isRight(result)).toBe(true)
      expect(result.right).toBe(5)
    })

    it('stops chainRight on Left values', async () => {
      const praxis = Praxis.create((x: number) => x * 2).chainRight(() => 2)

      const result = await praxis.run(10)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(20)
    })

    it('handles async chainRight functions', async () => {
      const praxis = Praxis.create(() => {
        return Zygon.right('hello')
      }).chainRight(async error => {
        await Promise.resolve()

        return error instanceof Task.RuntimePtoma ? '' : error.toUpperCase()
      })

      const result = await praxis.run()

      expect(Zygon.isRight(result)).toBe(true)
      expect(result.right).toBe('HELLO')
    })

    it('can chainRight multiple times', async () => {
      const praxis = Praxis.create(() => Zygon.right(new Error('hello')))
        .chainRight(error => error.message.length)
        .chainRight(length => (length instanceof Error ? 0 : length * 2))

      const result = await praxis.run()

      expect(Zygon.isRight(result)).toBe(true)
      expect(result.right).toBe(10)
    })

    it('can mix chain and chainRight', async () => {
      const praxis = Praxis.create((n: number) => Zygon.right(n * 3))
        .chainRight(() => Zygon.right(new Error('error')))
        .chainRight(error =>
          error instanceof Error ? error.message : 'unknown',
        )
        .chain(() => 3)

      const result = await praxis.run(5)

      expect(Zygon.isRight(result)).toBe(true)
      expect(result.right).toBe('error')
    })

    it('can mix pipe with chainRight', async () => {
      const praxis = Praxis.create(() => Zygon.right(new Error('nope')))
        .pipe(result =>
          result.right ? Zygon.right({ msg: result.right.message }) : result,
        )
        .chainRight(data => (data instanceof Error ? 0 : data.msg.length))

      const result = await praxis.run()

      expect(Zygon.isRight(result)).toBe(true)
      expect(result.right).toBe(4)
    })
  })

  describe('Praxis.recover', () => {
    it('transforms Right values into Left values', async () => {
      const praxis = Praxis.create(() =>
        Zygon.right(new Error('error')),
      ).recover(error => (error instanceof Error ? error.message : 'unknown'))

      const result = await praxis.run()

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe('error')
    })

    it('stops recover on Left values', async () => {
      const praxis = Praxis.create((x: number) => x * 2).recover(
        () => 'recovered',
      )

      const result = await praxis.run(10)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(20)
    })

    it('handles async recover functions', async () => {
      const praxis = Praxis.create(() =>
        Zygon.right(new Error('async error')),
      ).recover(async error => {
        await Promise.resolve()

        return error instanceof Error ? error.message.toUpperCase() : 'UNKNOWN'
      })

      const result = await praxis.run()

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe('ASYNC ERROR')
    })

    it('can recover multiple times', async () => {
      const praxis = Praxis.create(() => Zygon.right(new Error('hello')))
        .recover(error => error.message)
        .recover(err => err.message.length)

      const result = await praxis.run()

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe('hello')
    })

    it('can mix chain and recover', async () => {
      const praxis = Praxis.create((n: number) => n)
        .chain(value => value + 1)
        .recover(() => 10)
        .chain(value => value * 2)

      const result = await praxis.run(5)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(12)
    })

    it('can mix pipe with recover', async () => {
      const praxis = Praxis.create(() => Zygon.right(new Error('nope')))
        .recover(error => (error instanceof Error ? error.message : 'unknown'))
        .pipe(result => (result.left ? result.left.toUpperCase() : result))

      const result = await praxis.run()

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe('NOPE')
    })

    it('can mix chainRight with recover', async () => {
      const praxis = Praxis.create((n: number) => Zygon.right(n * 2))
        .chainRight(val => (val instanceof Error ? 0 : Zygon.right(val + 10)))
        .recover(error => `Number is ${error}`)

      const result = await praxis.run(5)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(`Number is 20`)
    })
  })

  describe('Praxis.merge', () => {
    it('merges with another praxis on Left values', async () => {
      const praxis = Praxis.create((x: number) => x + 1).merge(() =>
        Praxis.create((y: number) => y * 2),
      )

      const result = await praxis.run(10)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(22)
    })

    it('stops merge on Right values', async () => {
      const praxis = Praxis.create(() => {
        throw new Error('original error')
      }).merge(() => Praxis.create(() => 100))

      const result = await praxis.run()

      expect(Zygon.isRight(result)).toBe(true)
    })

    it('handles async merge functions', async () => {
      const praxis = Praxis.create((x: number) => x + 1).merge(async () => {
        await Promise.resolve()

        return Praxis.create((y: number) => y + 100)
      })

      const result = await praxis.run(10)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(111)
    })

    it('can merge multiple times', async () => {
      const praxis = Praxis.create((x: number) => x + 1)
        .merge(() => Praxis.create((y: number) => y + 10))
        .merge(() => Praxis.create((z: number) => z * 2))

      const result = await praxis.run(5)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(32)
    })

    it('can mix chain and merge', async () => {
      const praxis = Praxis.create((x: number) => x)
        .chain(value => value + 1)
        .merge(() => Praxis.create(value => value * 2))
        .chain(value => value + 10)

      const result = await praxis.run(5)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(22)
    })

    it('can mix pipe with merge', async () => {
      const praxis = Praxis.create((x: number) => x)
        .pipe(result => (result.left ? result.left + 1 : result))
        .merge(() => Praxis.create((y: number) => y * 3))
        .pipe(result => (result.left ? result.left + 5 : result))

      const result = await praxis.run(10)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(38)
    })

    it('inherits task properties from merged praxis', async () => {
      const outer = Praxis.create((x: number) => x * 2)
      const inner = Praxis.create((y: number) => y + 10)
      const praxis = outer.merge(() => inner)

      const result = await praxis.run(5)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(20)
    })
  })

  describe('Praxis.execute', () => {
    it('runs a side effect and returns original result', async () => {
      let executed = false
      const praxis = Praxis.create((x: number) => x * 2).execute(() => {
        executed = true
      })

      const result = await praxis.run(10)

      expect(executed).toBe(true)
      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(20)
    })

    it('passes result to the executor function', async () => {
      // biome-ignore lint: any is fine here
      let receivedResult: any = null

      const praxis = Praxis.create((x: number) => x + 1).execute(result => {
        receivedResult = result
      })

      await praxis.run(5)

      expect(Zygon.isLeft(receivedResult)).toBe(true)
      expect(receivedResult.left).toBe(6)
    })

    it('handles async executor functions', async () => {
      let executed = false

      const praxis = Praxis.create((x: number) => x * 2).execute(async () => {
        await Promise.resolve()
        executed = true
      })

      const result = await praxis.run(5)

      expect(executed).toBe(true)
      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(10)
    })

    it('can chain execute with other methods', async () => {
      let executed = false
      const praxis = Praxis.create((x: number) => x + 1)
        .execute(() => {
          executed = true
        })
        .chain(value => value * 2)

      const result = await praxis.run(5)

      expect(executed).toBe(true)
      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(12)
    })

    it('handles Right values in execute', async () => {
      let executed = false
      const praxis = Praxis.create(() => {
        throw new Error('original error')
      }).execute(() => {
        executed = true
      })

      const result = await praxis.run()

      expect(executed).toBe(true)
      expect(Zygon.isRight(result)).toBe(true)
    })

    it('can chain multiple executes', async () => {
      const executions: number[] = []

      const praxis = Praxis.create((x: number) => x)
        .execute(() => void executions.push(1))
        .execute(() => void executions.push(2))
        .execute(() => void executions.push(3))

      const result = await praxis.run(5)

      expect(executions).toEqual([1, 2, 3])
      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(5)
    })

    it('can mix pipe with execute', async () => {
      let executed = false

      const praxis = Praxis.create((x: number) => x)
        .pipe(result => (result.left ? result.left + 1 : result))
        .execute(() => {
          executed = true
        })
        .pipe(result => (result.left ? result.left * 2 : result))

      const result = await praxis.run(10)

      expect(executed).toBe(true)
      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(22)
    })

    it('can mix chainRight with execute', async () => {
      let executed = false

      const praxis = Praxis.create((n: number) => Zygon.right(n * 2))
        .execute(() => {
          executed = true
        })
        .chainRight(val => (val instanceof Error ? 0 : val + 10))

      const result = await praxis.run(5)

      expect(executed).toBe(true)
      expect(Zygon.isRight(result)).toBe(true)
      expect(result.right).toBe(20)
    })
  })

  describe('Praxis.effect', () => {
    it('fires effect asynchronously and returns original result', async () => {
      const praxis = Praxis.create((x: number) => x * 2).effect(() => {})

      const result = await praxis.run(10)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(20)
    })

    it('passes result to the effect function', async () => {
      // biome-ignore lint: any is fine here
      let receivedResult: any = null
      const praxis = Praxis.create((x: number) => x + 1).effect(result => {
        receivedResult = result
      })

      await praxis.run(5)

      expect(Zygon.isLeft(receivedResult)).toBe(true)
      expect(receivedResult.left).toBe(6)
    })

    it('handles async effect functions', async () => {
      let executed = false

      const praxis = Praxis.create((x: number) => x * 2).effect(async () => {
        await Promise.resolve()
        executed = true
      })

      const result = await praxis.run(5)

      expect(executed).toBe(true)
      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(10)
    })

    it('can chain effect with other methods', async () => {
      let executed = false

      const praxis = Praxis.create((x: number) => x + 1)
        .effect(() => {
          executed = true
        })
        .chain(value => value * 2)

      const result = await praxis.run(5)

      expect(executed).toBe(true)
      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(12)
    })

    it('handles Right values in effect', async () => {
      let executed = false

      const praxis = Praxis.create(() => {
        throw new Error('original error')
      }).effect(() => {
        executed = true
      })

      const result = await praxis.run()

      expect(executed).toBe(true)
      expect(Zygon.isRight(result)).toBe(true)
    })

    it('can chain multiple effects', async () => {
      const executions: number[] = []

      const praxis = Praxis.create((x: number) => x)
        .effect(() => void executions.push(1))
        .effect(() => void executions.push(2))
        .effect(() => void executions.push(3))

      const result = await praxis.run(5)

      expect(executions).toEqual([1, 2, 3])
      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(5)
    })

    it('can mix pipe with effect', async () => {
      let executed = false

      const praxis = Praxis.create((x: number) => x)
        .pipe(result => (result.left ? result.left + 1 : result))
        .effect(() => {
          executed = true
        })
        .pipe(result => (result.left ? result.left * 2 : result))

      const result = await praxis.run(10)

      expect(executed).toBe(true)
      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(22)
    })

    it('can mix chainRight with effect', async () => {
      let executed = false
      const praxis = Praxis.create((n: number) => Zygon.right(n * 2))
        .effect(() => {
          executed = true
        })
        .chainRight(val => (val instanceof Error ? 0 : val + 10))

      const result = await praxis.run(5)

      expect(executed).toBe(true)
      expect(Zygon.isRight(result)).toBe(true)
      expect(result.right).toBe(20)
    })

    it('calls catcher when effect throws', async () => {
      // biome-ignore lint: any is fine here
      let caughtError: any = null

      const praxis = Praxis.create((x: number) => x).effect(
        () => {
          throw new Error('effect error')
        },
        err => {
          caughtError = err
        },
      )

      const result = await praxis.run(5)

      expect(caughtError).toBeInstanceOf(Error)
      expect(caughtError.message).toBe('effect error')
      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(5)
    })

    it('execute effect in a separated promise flow that does not affect the praxis pipeline', async () => {
      let done: boolean = false

      const praxis = Praxis.create((x: number) => x).effect(() => {
        throw new Error('effect error')
      })

      const result = await praxis.run(5)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(5)

      const praxis2 = Praxis.create((x: number) => x * 2).effect(
        () =>
          new Promise(resolve =>
            setTimeout(() => {
              done = true

              resolve()
            }, 2000),
          ),
      )

      const result2 = await praxis2.run(5)

      expect(Zygon.isLeft(result2)).toBe(true)
      expect(result2.left).toBe(10)
      expect(done).toBe(false)
    })

    it('does not throw when effect fails without catcher', async () => {
      const praxis = Praxis.create((x: number) => x).effect(() => {
        throw new Error('unhandled effect error')
      })

      const result = await praxis.run(5)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(5)
    })

    it('effect runs after merge', async () => {
      let executedInMerge = false
      let executedInEffect = false

      const praxis = Praxis.create((x: number) => x + 1)
        .merge(() =>
          Praxis.create((y: number) => {
            executedInMerge = true
            return y * 2
          }),
        )
        .effect(() => {
          executedInEffect = true
        })

      const result = await praxis.run(5)

      expect(executedInMerge).toBe(true)
      expect(executedInEffect).toBe(true)
      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(12)
    })

    it('effect receives merged result', async () => {
      // biome-ignore lint: any is fine here
      let receivedResult: any = null

      const praxis = Praxis.create((x: number) => x)
        .merge(() => Praxis.create((y: number) => y + 10))
        .effect(result => {
          receivedResult = result
        })

      await praxis.run(5)

      expect(Zygon.isLeft(receivedResult)).toBe(true)
      expect(receivedResult.left).toBe(15)
    })
  })

  describe('Praxis.abort', () => {
    it('aborts a simple praxis and returns RuntimePtoma', async () => {
      const praxis = Praxis.create(async (x: number) => {
        await new Promise(resolve => setTimeout(resolve, 200))

        return x * 2
      })

      const promise = praxis.run(10)

      praxis.abort()

      const result = await promise

      expect(Zygon.isRight(result)).toBe(true)
      expect(result.right).toBeInstanceOf(Task.RuntimePtoma)
      expect(
        Task.RuntimePtoma.isAborted(result.right as Task.RuntimePtoma),
      ).toBe(true)
    })

    it('aborts a piped praxis and returns RuntimePtoma', async () => {
      const praxis = Praxis.create(async (x: number) => {
        await new Promise(resolve => setTimeout(resolve, 200))
        return x + 1
      }).pipe(result => {
        if (Zygon.isLeft(result)) {
          return result.left * 2
        }
        return result
      })

      const promise = praxis.run(10)

      praxis.abort()

      const result = await promise

      expect(Zygon.isRight(result)).toBe(true)
      expect(result.right).toBeInstanceOf(Task.RuntimePtoma)
      expect(
        Task.RuntimePtoma.isAborted(result.right as Task.RuntimePtoma),
      ).toBe(true)
    })

    it('aborts a chained praxis and returns RuntimePtoma', async () => {
      const praxis = Praxis.create(async (x: number) => {
        await new Promise(resolve => setTimeout(resolve, 200))
        return x + 1
      }).chain(value => value * 2)

      const promise = praxis.run(10)

      praxis.abort()

      const result = await promise

      expect(Zygon.isRight(result)).toBe(true)
      expect(result.right).toBeInstanceOf(Task.RuntimePtoma)
      expect(
        Task.RuntimePtoma.isAborted(result.right as Task.RuntimePtoma),
      ).toBe(true)
    })

    it('aborts a chainRight praxis and returns RuntimePtoma', async () => {
      const praxis = Praxis.create(() => {
        throw new Error('error')
      }).chainRight(async (val: Error) => {
        await new Promise(resolve => setTimeout(resolve, 200))

        return val.message
      })

      const promise = praxis.run()

      praxis.abort()

      const result = await promise

      expect(Zygon.isRight(result)).toBe(true)
      expect(result.right).toBeInstanceOf(Task.RuntimePtoma)
      expect(Task.RuntimePtoma.isAborted(result.right as any)).toBe(false)
    })

    it('aborts a recovered praxis and returns RuntimePtoma', async () => {
      const praxis = Praxis.create(() => Zygon.right(new Error('error')))
        .recover(async error => {
          await new Promise(resolve => setTimeout(resolve, 200))

          return error instanceof Error ? error.message : 'unknown'
        })
        .chain(value => value.toUpperCase())

      const promise = praxis.run()

      praxis.abort()

      const result = await promise

      expect(Zygon.isRight(result)).toBe(true)
      expect(result.right).toBeInstanceOf(Task.RuntimePtoma)
      expect(
        Task.RuntimePtoma.isAborted(result.right as Task.RuntimePtoma),
      ).toBe(true)
    })

    it('aborts a merged praxis and returns RuntimePtoma', async () => {
      const praxis = Praxis.create(async (x: number) => {
        await new Promise(resolve => setTimeout(resolve, 200))
        return x + 1
      }).merge(() => Praxis.create((y: number) => y * 2))

      const promise = praxis.run(10)

      praxis.abort()

      const result = await promise

      expect(Zygon.isRight(result)).toBe(true)
      expect(result.right).toBeInstanceOf(Task.RuntimePtoma)
      expect(
        Task.RuntimePtoma.isAborted(result.right as Task.RuntimePtoma),
      ).toBe(true)
    })

    it('aborts a multiple chained praxis and returns RuntimePtoma', async () => {
      const praxis = Praxis.create(async (x: number) => {
        await new Promise(resolve => setTimeout(resolve, 200))
        return x
      })
        .chain(value => value + 1)
        .chain(value => value * 2)
        .pipe(result => (result.left ? result.left + 10 : result))

      const promise = praxis.run(5)

      praxis.abort()

      const result = await promise

      expect(Zygon.isRight(result)).toBe(true)
      expect(result.right).toBeInstanceOf(Task.RuntimePtoma)
      expect(
        Task.RuntimePtoma.isAborted(result.right as Task.RuntimePtoma),
      ).toBe(true)
    })

    it('aborts with custom reason', async () => {
      const praxis = Praxis.create(async (x: number) => {
        await new Promise(resolve => setTimeout(resolve, 200))

        return x * 2
      })

      const promise = praxis.run(10)

      praxis.abort('custom abort reason')

      const result = await promise

      expect(Zygon.isRight(result)).toBe(true)
      expect(result.right).toBeInstanceOf(Task.RuntimePtoma)
      expect(
        Task.RuntimePtoma.isAborted(result.right as Task.RuntimePtoma),
      ).toBe(true)
      expect((result.right as Task.RuntimePtoma).cause).toBe(
        'custom abort reason',
      )
    })

    it('returns RuntimePtoma without aborting if task already completed', async () => {
      const praxis = Praxis.create((x: number) => x * 2)

      const result = await praxis.run(10)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(20)

      praxis.abort()

      const secondResult = await praxis.run(5)

      expect(Zygon.isLeft(secondResult)).toBe(true)
      expect(secondResult.left).toBe(10)
    })
  })
})
