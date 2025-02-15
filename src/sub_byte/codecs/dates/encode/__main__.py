import sys
import datetime


from ..core import encoder


def main(args = sys.argv[1:]):
    for encoded in encoder((datetime.date.fromisoformat(arg) for arg in args)):
        print(f'{hex(encoded)[2:].zfill(2)} ',end='')
    print()

    return 0


if __name__ == '__main__':
    main()