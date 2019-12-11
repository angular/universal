import { Injectable } from '@angular/core';
import { InMemoryDbService } from 'angular-in-memory-web-api';

@Injectable({
  providedIn: 'root'
})
export class PokemonService implements InMemoryDbService {
  createDb() {
    const pokemon = [
      {
        id: 'pikachu',
        name: 'pikachu',
        img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
      },
      {
        id: 'bulbasaur',
        name: 'charmander',
        img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png',
      },
      {
        id: 'charmander',
        name: 'charmander',
        img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png',
      },
      {
        id: 'squirtle',
        name: 'charmander',
        img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png',
      },
    ];
    return { pokemon };
  }
}
