import os
import pathlib

from hatchling.builders.hooks.plugin.interface import BuildHookInterface


class CustomHook(BuildHookInterface):
    def initialize(self, version, build_data):
        
        script = build_data.setdefault('scripts', {})

        src = pathlib.Path(__file__).parent / 'src'
        codecs  =  src / 'sub_byte' / 'codecs'

        for codec in codecs.iterdir():
            for dir_ in ['encode', 'decode']:
                if (codec / dir_ / '__main__.py').is_file():
                    script = f'sub_byte.codecs.{dir_}.__main__:main'
                    for c in ['_','-']:
                        scripts[f'{dir_}{c}{codec.name}'] = script